"""
Script used to configure the ESP32
"""

import argparse
import sys
import time
import hashlib
import uuid
import requests

COMMUNICATION_NODE_ADDRESS = "http://localhost:5000"
ESP32_DEVICE_ADDRESS = "http://192.168.4.1:80"


def validate_employee_auth_token(employee_auth_token):
    """
    Validates an employee authentication token by sending it to the communication node.

    Args:
        employee_auth_token (str): The authentication token of the employee.

    Returns:
        bool: True if the authentication token is valid, False otherwise.

    Exits:
        If the communication node is unavailable, the script exits with code 1.
    """
    try:
        res = requests.post(
            f"{COMMUNICATION_NODE_ADDRESS}/api/validate_employee_auth_token",
            json={"employee_auth_token": employee_auth_token},
            timeout=5000,
        )

    except requests.exceptions.ConnectionError:
        print("Communication node is not available, please check your connection")
        sys.exit(1)

    return res.status_code == 200


def check_if_business_exists(business_id):
    """
    Checks if a business exists in the system by querying the communication node.

    Args:
        business_id (int): The unique identifier of the business.

    Returns:
        bool: True if the business exists, False otherwise.

    Exits:
        If the communication node is unavailable, the script exits with code 1.
    """
    try:
        res = requests.get(
            f"{COMMUNICATION_NODE_ADDRESS}/api/business_exists/{business_id}",
            timeout=5000,
        )

    except requests.exceptions.ConnectionError:
        print("Communication node is not available, please check your connection")
        sys.exit(1)

    return res.status_code == 200


def check_device_connection():
    """
    Checks if the ESP32 device is accessible by sending a request to its API.

    Returns:
        bool: True if the device is reachable, False otherwise.
    """
    try:
        res = requests.get(f"{ESP32_DEVICE_ADDRESS}/api/check", timeout=5000)
    except requests.exceptions.ConnectionError:
        return False

    return res.status_code == 200


def check_wifi_credentials(ssid, password):
    """
    Placeholder function to check the validity of WiFi credentials.

    Args:
        ssid (str): The WiFi SSID.
        password (str): The WiFi password.

    Returns:
        bool: Always returns False since the function is not implemented.
    """
    print(ssid + "  " + password)
    return False


def generate_secure_sha512_hash():
    """
    Generates a secure SHA-512 hash using a random UUID.

    Returns:
        str: A SHA-512 hashed string.
    """
    random_uuid = str(uuid.uuid4())
    key = hashlib.sha512(random_uuid.encode()).hexdigest()
    return key


def upload_settings_to_communication_node(settings_dict):
    """
    Uploads device settings to the communication node.

    Args:
        settings_dict (dict): The settings dictionary containing device configurations.

    Returns:
        bool: True if the settings were successfully uploaded, False otherwise.

    Exits:
        If the communication node is unavailable, the script exits with code 1.
    """
    settings_dict.pop("ssid")
    settings_dict.pop("password")

    try:
        res = requests.post(
            f"{COMMUNICATION_NODE_ADDRESS}/api/register_device",
            json=settings_dict,
            timeout=5000,
        )

    except requests.exceptions.ConnectionError:
        print("Communication node is not available, please check your connection")
        sys.exit(1)

    return res.status_code == 200


def embed_settings_to_device(settings_dict):
    """
    Embeds device settings into the ESP32 device by sending them via its API.

    Args:
        settings_dict (dict): The settings dictionary containing configuration data.

    Returns:
        bool: True if the settings were successfully embedded, False otherwise.

    Exits:
        If the ESP32 device is unavailable, the script exits with code 1.
    """
    settings_dict.pop("business_id")
    settings_dict.pop("device_location")

    try:
        res = requests.post(
            f"{ESP32_DEVICE_ADDRESS}/api/config", json=settings_dict, timeout=5000
        )

    except requests.exceptions.ConnectionError:
        print("Device is not available, please check your connection")
        sys.exit(1)

    return res.status_code == 200


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        "This script registers a ESP32 device into the surveillance system"
        "\nAlso embeds the device with the required data"
        "to communicate with the communication node"
    )
    parser.add_argument(
        "employee_auth_token", type=str, help="The employee authentication token"
    )

    args = parser.parse_args()

    if not validate_employee_auth_token(args.employee_auth_token):
        print("Invalid employee authentication token")
        sys.exit(1)

    settings = dict.fromkeys(
        ["business_id", "device_location", "motion", "gas", "sound", "fire", "api_key"]
    )

    settings["business_id"] = int(input("Please enter the business ID: "))
    if not check_if_business_exists(settings["business_id"]):
        print("Business does not exist")
        sys.exit(1)

    settings["device_location"] = input(
        'Enter the device location [Example: "Main Entrance"]: '
    ).lower()

    while "motion" not in settings:
        settings["motion"] = bool(
            input("Does the device have motion detection? [yes/no]: ").lower() == "yes"
        )

    while "gas" not in settings:
        settings["gas"] = bool(
            input("Does the device have gas detection? [yes/no]: ").lower() == "yes"
        )

    while "sound" not in settings:
        settings["sound"] = bool(
            input("Does the device have sound detection? [yes/no]: ").lower() == "yes"
        )

    while "fire" not in settings:
        settings["fire"] = bool(
            input("Does the device have fire detection? [yes/no]: ").lower() == "yes"
        )

    print(
        "Enter the WiFi credentials so that the device can connect to"
        " the network and communicate with the communication node"
    )
    while True:
        settings["ssid"] = input("Please enter the WiFi SSID: ")
        settings["password"] = input("Please enter the WiFi password: ")

        if check_wifi_credentials(settings["ssid"], settings["password"]):
            break

        print("Invalid WiFi credentials, please try again")

    settings["api_key"] = generate_secure_sha512_hash()

    if not upload_settings_to_communication_node(settings):
        print("Failed to upload settings to the communication node")
        sys.exit(1)

    print("Settings uploaded to the communication node")

    print(
        "Please connect to the ESP32 device"
        '\nThe default SSID is "ESP32" and the password is "admin1234"'
    )
    while not check_device_connection():
        time.sleep(3)

    print("Embedding settings to the device...")
    if not embed_settings_to_device(settings):
        print("Failed to embed settings to the device")
        sys.exit(1)

    print("Settings embedded to the device")
    print("Device registration completed successfully")
