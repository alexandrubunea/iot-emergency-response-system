"""
Emulator for the API calls of the security device.
"""
import requests
import json
import os
import uuid
import sys

def clear_screen():
    """Clears the terminal screen."""
    if sys.stdout.isatty():
        os.system('cls' if os.name == 'nt' else 'clear')
    else:
        print("\n" * 5)

def get_input(prompt, default=None):
    """Gets input from the user, providing an optional default value."""
    if not sys.stdin.isatty():
        print(f"Warning: Cannot get input in non-interactive mode for '{prompt}'. Using default: {default}")
        return default

    if default:
        user_input = input(f"{prompt} [{default}]: ")
        return user_input or default
    else:
        while True:
            user_input = input(f"{prompt}: ")
            if user_input:
                return user_input
            else:
                print("Input cannot be empty.")


def get_bool_input(prompt, default=False):
    """Gets boolean input from the user."""
    if not sys.stdin.isatty():
        print(f"Warning: Cannot get boolean input in non-interactive mode for '{prompt}'. Using default: {default}")
        return default

    default_str = 'y' if default else 'n'
    while True:
        val = input(f"{prompt} (y/n) [{default_str}]: ").lower()
        if not val:
            return default
        if val == 'y':
            return True
        elif val == 'n':
            return False
        else:
            print("Invalid input. Please enter 'y' or 'n'.")

def print_response(response):
    """Prints the details of the HTTP response."""
    print("\n--- Response ---")
    print(f"Status Code: {response.status_code}")
    print("Headers:")
    for key, value in response.headers.items():
         if key.lower() != 'set-cookie':
            print(f"  {key}: {value}")
         else:
            print(f"  {key}: ***REDACTED***")
    try:
        print("Body (JSON):")
        print(json.dumps(response.json(), indent=2))
    except json.JSONDecodeError:
        print("Body (Text):")
        print(response.text if response.text else "[No Body]")
    except Exception as e:
        print(f"Could not parse response body: {e}")
        print("Raw Body:")
        print(response.text if response.text else "[No Body]")
    print("---------------\n")

def make_request(base_url, method, endpoint, headers=None, json_payload=None):
    """Makes an HTTP request and prints the response."""
    if not base_url:
        print("Error: API Base URL not set.")
        return None

    if not endpoint.startswith('/'):
        endpoint = '/' + endpoint
    if base_url.endswith('/'):
        base_url = base_url[:-1]

    url = f"{base_url}{endpoint}"
    print(f"\nMaking {method.upper()} request to: {url}")
    if headers:
        printable_headers = headers.copy()
        if 'Authorization' in printable_headers:
             printable_headers['Authorization'] = 'Bearer ***REDACTED***'
        print(f"Headers: {printable_headers}")
    if json_payload:
        print(f"JSON Payload: {json.dumps(json_payload, indent=2)}")

    response = None
    try:
        response = requests.request(method, url, headers=headers, json=json_payload, timeout=30) # Added timeout
        print_response(response)
    except requests.exceptions.ConnectionError as e:
        print(f"\nError: Could not connect to the server at {base_url}.")
        print(f"Please ensure the server is running and the Base URL is correct.")
        print(f"Details: {e}")
    except requests.exceptions.Timeout:
        print(f"\nError: Request timed out after 30 seconds.")
    except requests.exceptions.RequestException as e:
        print(f"\nAn unexpected error occurred during the request: {e}")

    return response


def simulate_register_device(base_url, config_key):
    """Simulates the /api/register_device call."""
    if not config_key:
        print("Error: Configurator API Key (Level 1) not set.")
        return

    print("\n--- Register New Device ---")
    headers = {"Authorization": f"Bearer {config_key}", "Content-Type": "application/json"}

    suggested_device_key = str(uuid.uuid4())[:64]
    api_key = get_input("Enter NEW API Key for the device", suggested_device_key)
    device_location = get_input("Enter Device Location/Name", "Living Room Sensor")
    motion = get_bool_input("Enable Motion Sensor?", True)
    sound = get_bool_input("Enable Sound Sensor?", True)
    fire = get_bool_input("Enable Fire Sensor?", True)
    gas = get_bool_input("Enable Gas Sensor?", True)

    business_id_str = get_input("Enter Business ID", "1")
    try:
        business_id = int(business_id_str)
    except ValueError:
        print("Invalid Business ID. Please enter an integer.")
        return


    payload = {
        "api_key": api_key,
        "device_location": device_location,
        "motion": motion,
        "sound": sound,
        "fire": fire,
        "gas": gas,
        "business_id": business_id
    }

    response = make_request(base_url, "POST", "/api/register_device", headers=headers, json_payload=payload)
    if response and response.status_code == 200:
        print("\nImportant: If registration was successful, you might want to update")
        print(f"the 'Device API Key' in this script to '{api_key}' for subsequent device calls (Option 7).")
    elif response:
        print(f"\nRegistration failed with status code {response.status_code}.")
    else:
        print("\nRegistration request could not be completed.")


def simulate_business_exists(base_url, config_key):
    """Simulates the /api/business_exists/<id> call."""
    if not config_key:
        print("Error: Configurator API Key (Level 1) not set.")
        return

    print("\n--- Check Business Existence ---")
    headers = {"Authorization": f"Bearer {config_key}"}
    business_id = get_input("Enter Business ID to check", "1")
    if not business_id.isdigit():
        print("Invalid Business ID. Please enter an integer.")
        return

    endpoint = f"/api/business_exists/{business_id}"
    make_request(base_url, "GET", endpoint, headers=headers)


def simulate_validate_employee_token(base_url, config_key):
    """Simulates the /api/validate_employee_auth_token call."""
    if not config_key:
        print("Error: Configurator API Key (Level 1) not set.")
        return

    print("\n--- Validate Employee Auth Token ---")
    headers = {"Authorization": f"Bearer {config_key}"}
    endpoint = "/api/validate_employee_auth_token"
    make_request(base_url, "GET", endpoint, headers=headers)


def simulate_send_alert(base_url, device_key):
    """Simulates the /api/send_alert call."""
    if not device_key:
        print("Error: Device API Key (Level 2) not set.")
        return

    print("\n--- Send Alert ---")
    headers = {"Authorization": f"Bearer {device_key}", "Content-Type": "application/json"}

    alert_types = ['fire', 'gas', 'motion', 'sound']
    print("Available Alert Types:")
    for i, type_name in enumerate(alert_types):
        print(f"  {i + 1}. {type_name}")

    while True:
        choice = get_input(f"Select Alert Type (1-{len(alert_types)}): ")
        if choice.isdigit() and 1 <= int(choice) <= len(alert_types):
            alert_type = alert_types[int(choice) - 1]
            break
        else:
            print("Invalid choice.")

    message = get_input("Enter optional alert message (leave blank for none)", "")

    payload = {"alert_type": alert_type + "_alert"}
    if message:
        payload["message"] = message

    make_request(base_url, "POST", "/api/send_alert", headers=headers, json_payload=payload)


def simulate_send_malfunction(base_url, device_key):
    """Simulates the /api/send_malfunction call."""
    if not device_key:
        print("Error: Device API Key (Level 2) not set.")
        return

    print("\n--- Send Malfunction ---")
    headers = {"Authorization": f"Bearer {device_key}", "Content-Type": "application/json"}

    malfunction_types = [
        'fire_sensor',
        'gas_sensor',
        'sound_sensor',
        'motion_sensor',
        'general_malfunction',
    ]
    print("Available Malfunction Types:")
    for i, type_name in enumerate(malfunction_types):
        print(f"  {i + 1}. {type_name}")

    while True:
        choice = get_input(f"Select Malfunction Type (1-{len(malfunction_types)}): ")
        if choice.isdigit() and 1 <= int(choice) <= len(malfunction_types):
            malfunction_type = malfunction_types[int(choice) - 1]
            break
        else:
            print("Invalid choice.")

    message = get_input("Enter optional malfunction message (e.g., 'Voltage reading: 0.1V')", "")

    payload = {"malfunction_type": malfunction_type}
    if message:
        payload["message"] = message

    make_request(base_url, "POST", "/api/send_malfunction", headers=headers, json_payload=payload)


def simulate_send_log(base_url, device_key):
    """Simulates the /api/send_log call."""
    if not device_key:
        print("Error: Device API Key (Level 2) not set.")
        return

    print("\n--- Send Log ---")
    headers = {"Authorization": f"Bearer {device_key}", "Content-Type": "application/json"}

    log_types = [
        'esp32_boot',
        'gas_sensor_warmup',
    ]
    print("Available Log Types:")
    for i, type_name in enumerate(log_types):
        print(f"  {i + 1}. {type_name}")

    while True:
        choice = get_input(f"Select Log Type (1-{len(log_types)}): ")
        if choice.isdigit() and 1 <= int(choice) <= len(log_types):
            log_type = log_types[int(choice) - 1]
            break
        else:
            print("Invalid choice.")

    message = get_input("Enter optional log message (leave blank for none)", "")

    payload = {"log_type": log_type}
    if message:
        payload["message"] = message

    make_request(base_url, "POST", "/api/send_log", headers=headers, json_payload=payload)

def main_menu():
    """Displays the main menu and handles user selection."""
    base_url = ""
    configurator_api_key = ""
    device_api_key = ""

    print("===== Initial Setup =====")
    base_url = get_input("Enter API Base URL (e.g., http://localhost:5000)", base_url if base_url else "http://localhost:5000")
    configurator_api_key = get_input("Enter Configurator API Key (Level 1)", configurator_api_key if configurator_api_key else "")
    device_api_key = get_input("Enter Device API Key (Level 2)", device_api_key if device_api_key else "")
    print("=========================\n")


    while True:
        clear_screen()
        print("===== API Call Emulator =====")
        print(f"Base URL: {base_url if base_url else 'Not Set'}")
        print(f"Configurator Key: {'Set' if configurator_api_key else 'Not Set'}")
        print(f"Device Key: {'Set' if device_api_key else 'Not Set'}")
        print("-----------------------------")
        print("--- Configurator Calls (Requires Level 1 Key) ---")
        print("1. Register Device")
        print("2. Check Business Exists")
        print("3. Validate Employee Auth Token")
        print("--- Device Calls (Requires Level 2 Key) ---")
        print("4. Send Alert")
        print("5. Send Malfunction")
        print("6. Send Log")
        print("--- Settings ---")
        print("7. Configure Settings (URL/Keys)")
        print("8. Exit")
        print("=============================")

        choice = get_input("Enter your choice")
        if not choice:
            print("No input received. Exiting.")
            break

        if choice == '1':
            simulate_register_device(base_url, configurator_api_key)
        elif choice == '2':
            simulate_business_exists(base_url, configurator_api_key)
        elif choice == '3':
            simulate_validate_employee_token(base_url, configurator_api_key)
        elif choice == '4':
            simulate_send_alert(base_url, device_api_key)
        elif choice == '5':
            simulate_send_malfunction(base_url, device_api_key)
        elif choice == '6':
            simulate_send_log(base_url, device_api_key)
        elif choice == '7':
            print("\n--- Configure Settings ---")
            base_url = get_input("Enter API Base URL", base_url)
            configurator_api_key = get_input("Enter Configurator API Key (Level 1)", configurator_api_key)
            device_api_key = get_input("Enter Device API Key (Level 2)", device_api_key)
            print("Settings updated.")
        elif choice == '8':
            print("Exiting.")
            break
        else:
            print("Invalid choice. Please try again.")

        if sys.stdin.isatty():
            input("\nPress Enter to continue...")
        else:
            import time
            time.sleep(1)

if __name__ == "__main__":
    if not sys.stdin.isatty():
        print("Warning: Running in non-interactive mode. Input prompts will use defaults or fail if no default is provided.")
    main_menu()
