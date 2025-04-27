"""
Script used to configure the ESP32 security devices
"""

import argparse
import sys
import time
import hashlib
import uuid
import getpass
import re
import json
import requests
from rich.console import Console
from rich.prompt import Confirm, Prompt
from rich.progress import Progress

# Constants
COMMUNICATION_NODE_ADDRESS = "http://localhost:5000"
ESP32_DEVICE_ADDRESS = "http://192.168.4.1:80"
ESP32_DEFAULT_SSID = "ESP32"
ESP32_DEFAULT_PASSWORD = "admin1234"
REQUEST_TIMEOUT = 10  # seconds

# Initialize rich console for better UI
console = Console()


def validate_employee_auth_token(employee_auth_token):
    """
    Validates an employee authentication token by sending it to the communication node.

    Args:
        employee_auth_token (str): The authentication token of the employee.

    Returns:
        bool: True if the authentication token is valid, False otherwise.
    """
    try:
        console.log("Validating employee authentication token...")
        res = requests.get(
            f"{COMMUNICATION_NODE_ADDRESS}/api/validate_employee_auth_token",
            headers={"Authorization": f"Bearer {employee_auth_token}"},
            timeout=REQUEST_TIMEOUT,
        )
        return res.status_code == 200
    except requests.exceptions.RequestException as e:
        console.log(f"[bold red]Error connecting to communication node: {str(e)}[/]")
        return False


def check_if_business_exists(business_id, employee_auth_token):
    """
    Checks if a business exists in the system by querying the communication node.

    Args:
        business_id (int): The unique identifier of the business.
        employee_auth_token (str): The authentication token of the employee.

    Returns:
        bool: True if the business exists, False otherwise.
    """
    try:
        console.log(f"Verifying business ID {business_id}...")
        res = requests.get(
            f"{COMMUNICATION_NODE_ADDRESS}/api/business_exists/{business_id}",
            headers={"Authorization": f"Bearer {employee_auth_token}"},
            timeout=REQUEST_TIMEOUT,
        )
        return res.status_code == 200
    except requests.exceptions.RequestException as e:
        console.log(f"[bold red]Error connecting to communication node: {str(e)}[/]")
        return False


def check_device_connection():
    """
    Checks if the ESP32 device is accessible by sending a request to its API.

    Returns:
        bool: True if the device is reachable, False otherwise.
    """
    try:
        console.log("Checking connection to ESP32 device...")
        res = requests.get(f"{ESP32_DEVICE_ADDRESS}/api/check", timeout=REQUEST_TIMEOUT)
        return res.status_code == 200
    except requests.exceptions.RequestException:
        return False


def validate_wifi_ssid(ssid):
    """
    Validates WiFi SSID format.

    Args:
        ssid (str): The WiFi SSID.

    Returns:
        bool: True if the SSID is valid, False otherwise.
    """
    # SSID must be 1-32 characters
    return 1 <= len(ssid) <= 32


def validate_wifi_password(password):
    """
    Validates WiFi password format.

    Args:
        password (str): The WiFi password.

    Returns:
        bool: True if the password is valid, False otherwise.
    """
    # Password must be at least 8 characters
    return len(password) >= 8


def generate_secure_api_key_hash():
    """
    Generates a secure api_key hash using a random UUID.

    Returns:
        str: An API Key.
    """
    random_uuid = str(uuid.uuid4())
    key = hashlib.sha256(random_uuid.encode()).hexdigest()[:64]
    return key


def upload_settings_to_communication_node(settings_dict, employee_auth_token):
    """
    Uploads device settings to the communication node.

    Args:
        settings_dict (dict): The settings dictionary containing device configurations.
        employee_auth_token (str): The authentication token of the employee.

    Returns:
        bool: True if the settings were successfully uploaded, False otherwise.
    """
    # Create a copy of the settings to avoid modifying the original
    upload_settings = settings_dict.copy()

    # Remove WiFi credentials for security
    if "ssid" in upload_settings:
        upload_settings.pop("ssid")
    if "password" in upload_settings:
        upload_settings.pop("password")

    try:
        console.log("Uploading device settings to communication node...")
        res = requests.post(
            f"{COMMUNICATION_NODE_ADDRESS}/api/register_device",
            headers={"Authorization": f"Bearer {employee_auth_token}"},
            json=upload_settings,
            timeout=REQUEST_TIMEOUT,
        )

        if res.status_code != 200:
            try:
                error_msg = res.json().get("message", "Unknown error")
            except Exception:
                error_msg = "Unknown error"
            finally:
                console.log(f"[bold red]Error uploading settings: {error_msg}[/]")

        return res.status_code == 200
    except requests.exceptions.RequestException as e:
        console.log(f"[bold red]Error connecting to communication node: {str(e)}[/]")
        return False


def embed_settings_to_device(settings_dict):
    """
    Embeds device settings into the ESP32 device by sending them via its API.

    Args:
        settings_dict (dict): The settings dictionary containing configuration data.

    Returns:
        bool: True if the settings were successfully embedded, False otherwise.
    """
    # Create a copy of the settings to avoid modifying the original
    device_settings = settings_dict.copy()

    # Remove unnecessary fields for device configuration
    if "business_id" in device_settings:
        device_settings.pop("business_id")
    if "device_location" in device_settings:
        device_settings.pop("device_location")

    try:
        console.log("Embedding settings to ESP32 device...")
        res = requests.post(
            f"{ESP32_DEVICE_ADDRESS}/api/config",
            json=device_settings,
            timeout=REQUEST_TIMEOUT,
        )

        if res.status_code != 200:
            try:
                error_msg = res.json().get("message", "Unknown error")
            except Exception:
                error_msg = "Unknown error"
            finally:
                console.log(f"[bold red]Error embedding settings: {error_msg}[/]")

        return res.status_code == 200
    except requests.exceptions.RequestException as e:
        console.log(f"[bold red]Error connecting to ESP32 device: {str(e)}[/]")
        return False


def validate_device_location(location):
    """
    Validates device location name.

    Args:
        location (str): The device location name.

    Returns:
        bool: True if the location name is valid, False otherwise.
    """
    # Location should be at least 3 characters and
    # contain alphanumeric characters, spaces, or hyphens
    if len(location) < 3:
        return False
    return bool(re.match(r"^[a-zA-Z0-9\s\-_]+$", location))


def wait_for_device_connection(max_attempts=20, wait_time=3):
    """
    Waits for the ESP32 device to become available.

    Args:
        max_attempts (int): Maximum number of connection attempts.
        wait_time (int): Seconds to wait between attempts.

    Returns:
        bool: True if connection was established, False if max attempts reached.
    """
    console.log(f"Waiting for ESP32 device connection (max {max_attempts} attempts)...")

    with Progress() as progress:
        task = progress.add_task("[cyan]Connecting to ESP32...", total=max_attempts)

        for _ in range(max_attempts):
            if check_device_connection():
                console.log("[bold green]Successfully connected to ESP32 device![/]")
                return True

            progress.update(task, advance=1)
            time.sleep(wait_time)

    console.log("[bold red]Failed to connect to ESP32 device after maximum attempts[/]")
    return False


def save_configuration_backup(settings):
    """
    Saves the device configuration to a local backup file.

    Args:
        settings (dict): Device configuration settings.
    """
    try:
        # Create a copy of settings for the backup
        backup_settings = settings.copy()

        # Remove sensitive WiFi password but keep other data
        if "password" in backup_settings:
            backup_settings["password"] = "********"  # Mask password

        # Generate filename with timestamp and business ID
        timestamp = time.strftime("%Y%m%d-%H%M%S")
        filename = f"device_config_business{settings['business_id']}_{timestamp}.json"

        with open(filename, "w", encoding="utf-8") as f:
            json.dump(backup_settings, f, indent=2)

        console.log(f"[green]Configuration backup saved to {filename}[/]")
    except Exception as e:
        console.log(
            f"[yellow]Warning: Could not save configuration backup: {str(e)}[/]"
        )


def get_authentication_token(token_arg):
    """
    Get and validate the employee authentication token.

    Args:
        token_arg (str): Token provided via command line argument.

    Returns:
        str: Validated authentication token.
    """
    auth_token = token_arg
    if not auth_token:
        auth_token = getpass.getpass(
            "Please enter your employee authentication token: "
        )

    # Validate employee authentication
    if not validate_employee_auth_token(auth_token):
        console.print("[bold red]Invalid employee authentication token[/]")
        sys.exit(1)

    console.print("[bold green]Employee authentication successful![/]")
    return auth_token


def get_business_id(business_arg, auth_token):
    """
    Get and validate the business ID.

    Args:
        business_arg (int): Business ID provided via command line argument.
        auth_token (str): Employee authentication token.

    Returns:
        int: Validated business ID.
    """
    if business_arg:
        if check_if_business_exists(business_arg, auth_token):
            return business_arg
        console.print("[bold red]Business does not exist[/]")

    business_id = None
    while business_id is None:
        try:
            bid = int(Prompt.ask("Please enter the business ID", default=""))
            if check_if_business_exists(bid, auth_token):
                business_id = bid
            else:
                console.print("[bold red]Business does not exist[/]")
        except ValueError:
            console.print("[bold red]Please enter a valid number[/]")

    return business_id


def get_device_location(location_arg):
    """
    Get and validate the device location.

    Args:
        location_arg (str): Location provided via command line argument.

    Returns:
        str: Validated device location.
    """
    if location_arg and validate_device_location(location_arg):
        return location_arg.lower()

    device_location = None
    while device_location is None:
        location = Prompt.ask('Enter the device location (e.g., "Main Entrance")')
        if validate_device_location(location):
            device_location = location.lower()
        else:
            console.print(
                "[bold red]Please enter a valid location (at least 3 characters, "
                "alphanumeric with spaces or hyphens)[/]"
            )

    return device_location


def configure_sensors():
    """
    Configure device sensor capabilities.

    Returns:
        dict: Sensor configuration settings.
    """
    sensors = {
        "motion": Confirm.ask("Does the device have motion detection?", default=False),
        "gas": Confirm.ask("Does the device have gas detection?", default=False),
        "sound": Confirm.ask("Does the device have sound detection?", default=False),
        "fire": Confirm.ask("Does the device have fire detection?", default=False),
    }

    return sensors


def get_wifi_credentials(ssid_arg):
    """
    Get and validate WiFi credentials.

    Args:
        ssid_arg (str): SSID provided via command line argument.

    Returns:
        dict: WiFi credentials.
    """
    console.print(
        "\n[bold]Enter WiFi credentials for the device to connect to the network[/]"
    )

    # Get SSID
    ssid = None
    if ssid_arg and validate_wifi_ssid(ssid_arg):
        ssid = ssid_arg
    else:
        while ssid is None:
            input_ssid = Prompt.ask("Please enter the WiFi SSID")
            if validate_wifi_ssid(input_ssid):
                ssid = input_ssid
            else:
                console.print(
                    "[bold red]Invalid SSID format (must be 1-32 characters)[/]"
                )

    # Get password
    password = None
    while password is None:
        input_password = getpass.getpass("Please enter the WiFi password: ")
        if validate_wifi_password(input_password):
            password = input_password
        else:
            console.print(
                "[bold red]Invalid password (must be at least 8 characters)[/]"
            )

    return {"ssid": ssid, "password": password}


def display_configuration_summary(settings):
    """
    Display a summary of the device configuration.

    Args:
        settings (dict): Device configuration settings.
    """
    console.rule("[bold]Configuration Summary[/]")
    console.print(f"Business ID: {settings['business_id']}")
    console.print(f"Device Location: {settings['device_location']}")
    console.print(
        f"Motion Detection: {'Enabled' if settings['motion'] else 'Disabled'}"
    )
    console.print(f"Gas Detection: {'Enabled' if settings['gas'] else 'Disabled'}")
    console.print(f"Sound Detection: {'Enabled' if settings['sound'] else 'Disabled'}")
    console.print(f"Fire Detection: {'Enabled' if settings['fire'] else 'Disabled'}")
    console.print(f"WiFi SSID: {settings['ssid']}")
    # pylint: disable=E1136
    console.print(f"API Key: {settings['api_key'][:8]}...{settings['api_key'][-8:]}")
    console.rule()


def handle_upload_to_node(settings, auth_token):
    """
    Handle the upload of settings to the communication node.

    Args:
        settings (dict): Device configuration settings.
        auth_token (str): Employee authentication token.

    Returns:
        bool: True if upload was successful, False otherwise.
    """
    if not upload_settings_to_communication_node(settings, auth_token):
        console.print(
            "[bold red]Failed to upload settings to the communication node[/]"
        )
        if Confirm.ask("[bold]Do you want to retry?[/]", default=True):
            if not upload_settings_to_communication_node(settings, auth_token):
                console.print("[bold red]Failed again. Exiting...[/]")
                return False
        else:
            return False

    console.print(
        "[bold green]Settings successfully uploaded to the communication node[/]"
    )
    return True


def handle_device_connection_and_configuration(settings):
    """
    Handle connection to the ESP32 device and configuration.

    Args:
        settings (dict): Device configuration settings.

    Returns:
        bool: True if connection and configuration were successful, False otherwise.
    """
    # Guide for connecting to ESP32
    console.print("\n[bold]Please connect to the ESP32 device[/]")
    console.print(
        f"The default SSID is '[bold]{ESP32_DEFAULT_SSID}[/]' and the password "
        f"is '[bold]{ESP32_DEFAULT_PASSWORD}[/]'"
    )

    # Wait for device connection
    if not handle_device_connection():
        return False

    # Embed settings to the device
    if not handle_device_configuration(settings):
        return False

    return True


def handle_device_connection():
    """
    Handle connection to the ESP32 device.

    Returns:
        bool: True if connection was successful, False otherwise.
    """
    if not wait_for_device_connection():
        console.print("\n[bold red]Failed to connect to the ESP32 device[/]")
        console.print("[yellow]Please check that:")
        console.print("1. The device is powered on")
        console.print("2. You are connected to the ESP32's WiFi network")
        console.print("3. The device is in configuration mode")

        if not Confirm.ask(
            "[bold]Do you want to retry connecting to the device?[/]", default=True
        ):
            console.print(
                "[yellow]Configuration incomplete. Settings were uploaded to the server but not"
                " to the device.[/]"
            )
            return False

        if not wait_for_device_connection(max_attempts=10):
            console.print(
                "[bold red]Failed to connect again. Configuration incomplete.[/]"
            )
            console.print(
                "[yellow]Settings were uploaded to the server but not to the device.[/]"
            )
            return False

    return True


def handle_device_configuration(settings):
    """
    Handle configuration of the ESP32 device.

    Args:
        settings (dict): Device configuration settings.

    Returns:
        bool: True if configuration was successful, False otherwise.
    """
    console.print("\n[bold]Embedding settings to the device...[/]")
    if not embed_settings_to_device(settings):
        console.print("[bold red]Failed to embed settings to the device[/]")
        if Confirm.ask("[bold]Do you want to retry?[/]", default=True):
            if not embed_settings_to_device(settings):
                console.print("[bold red]Failed again. Configuration incomplete.[/]")
                console.print(
                    "[yellow]Settings were uploaded to the server but not to the device.[/]"
                )
                return False
        else:
            console.print(
                "[yellow]Configuration incomplete. Settings were uploaded to the server but"
                " not to the device.[/]"
            )
            return False

    console.print("[bold green]Settings successfully embedded to the device[/]")
    return True


def display_success_message(settings):
    """
    Display a success message after successful configuration.

    Args:
        settings (dict): Device configuration settings.
    """
    console.print("\n[bold green]🎉 Device registration completed successfully! 🎉[/]")
    console.print(
        f"The device at [bold]{settings['device_location']}[/] for business ID"
        f" [bold]{settings['business_id']}[/] is now configured and ready to use."
    )


def main():
    """Main function to run the ESP32 configuration process."""
    parser = argparse.ArgumentParser(
        description="ESP32 Security Device Configuration Tool\n"
        "This script registers an ESP32 device into the surveillance system and "
        "embeds the device with the required data to communicate with the communication node."
    )

    parser.add_argument(
        "-t", "--token", type=str, help="The employee authentication token"
    )

    parser.add_argument("--business", type=int, help="Business ID for the device")

    parser.add_argument(
        "--location", type=str, help="Device location (e.g., 'Main Entrance')"
    )

    parser.add_argument("--ssid", type=str, help="WiFi network SSID")

    parser.add_argument(
        "--no-backup",
        action="store_true",
        help="Don't create configuration backup file",
    )

    args = parser.parse_args()

    console.rule("[bold blue]ESP32 Security Device Configuration Tool[/]")
    console.print(
        "\n[bold]Welcome to the ESP32 Security Device Configuration Tool[/]\n"
    )

    # Get and validate employee authentication token
    auth_token = get_authentication_token(args.token)

    # Initialize settings dictionary with default values
    settings = {
        "business_id": None,
        "device_location": None,
        "motion": False,
        "gas": False,
        "sound": False,
        "fire": False,
        "ssid": None,
        "password": None,
        "api_key": None,
    }

    # Get and validate business ID
    settings["business_id"] = get_business_id(args.business, auth_token)

    # Get and validate device location
    settings["device_location"] = get_device_location(args.location)

    # Configure sensor capabilities
    settings.update(configure_sensors())

    # Get and validate WiFi credentials
    settings.update(get_wifi_credentials(args.ssid))

    # Generate API key
    settings["api_key"] = generate_secure_api_key_hash()

    # Display configuration summary
    display_configuration_summary(settings)

    # Confirm before proceeding
    if not Confirm.ask(
        "[bold]Do you want to proceed with this configuration?[/]", default=True
    ):
        console.print("[yellow]Configuration cancelled by user[/]")
        sys.exit(0)

    # Upload settings to communication node
    if not handle_upload_to_node(settings, auth_token):
        sys.exit(1)

    # Create configuration backup
    if not args.no_backup:
        save_configuration_backup(settings)

    # Connect to ESP32 device and configure it
    if not handle_device_connection_and_configuration(settings):
        sys.exit(1)

    # Display success message
    display_success_message(settings)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        console.print("\n[yellow]Configuration cancelled by user[/]")
        sys.exit(0)
    except Exception as e:
        console.print(f"\n[bold red]An unexpected error occurred: {str(e)}[/]")
        sys.exit(1)
