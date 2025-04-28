# ESP32 Device Configurator

## Overview

This command-line tool simplifies the initial setup and configuration process for the ESP32 IoT Emergency Response System devices.

It guides the user through authenticating, validating business information, connecting to the device in AP mode, gathering necessary settings (Wi-Fi, sensors, location), generating a unique API key, registering the device with the backend communication node, and finally sending the configuration to the ESP32 itself.

## Features

*   Interactive command-line interface using `rich` for a better user experience.
*   Validates employee authentication token and business ID against the backend.
*   Automatically detects and connects to the ESP32 device when it's in AP mode.
*   Prompts for required configuration: device location, enabled sensors, and target Wi-Fi network credentials.
*   Generates a secure, unique API key for each device.
*   Registers the device information (location, business ID, API key) with the backend communication node.
*   Sends the final configuration (Wi-Fi credentials, API key, sensor settings) to the ESP32.
*   Provides command-line arguments for faster configuration if some details are known beforehand.
*   Creates a local backup (`config_backup.json`) of the configuration for reference.

## Requirements

*   Python 3.x
*   `pip` (Python package installer)

## Installation

1.  **Navigate to the configurator directory:**
    ```bash
    cd path/to/iot-emergency-response-system/configurator
    ```
2.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```
    This will install `requests` and `rich`.

## Usage

### Prerequisites

1.  The ESP32 device must be flashed with the firmware from the `esp32-software` directory and powered on for the first time (or after an NVS erase). It should be broadcasting the default AP:
    *   **SSID:** `ESP32`
    *   **Password:** `admin1234`
2.  The computer running this script must be connected to the `ESP32` Wi-Fi network.
3.  The backend communication node must be running and accessible from the computer running the script (default address `http://localhost:5000`).

### Running the Script

Execute the script from the `configurator` directory:

```bash
python main.py
```

The script will then guide you through the following steps:

1.  **Employee Authentication:** Enter your valid authentication token.
2.  **Business ID:** Enter the ID of the business this device belongs to.
3.  **Device Connection:** The script will attempt to connect to `http://192.168.4.1`. Ensure your computer is connected to the ESP32's Wi-Fi.
4.  **Device Location:** Enter a descriptive name for the device's location (e.g., "Main Lobby", "Server Room 2").
5.  **Sensor Configuration:** Answer yes/no prompts to enable/disable Motion, Sound, Gas, and Fire sensors.
6.  **Wi-Fi Configuration:** Enter the SSID (network name) and Password for the Wi-Fi network the ESP32 should connect to after configuration.
7.  **Configuration Summary:** Review the settings. Confirm to proceed.
8.  **Registration & Configuration:** The script will automatically:
    *   Generate an API key.
    *   Register the device with the backend.
    *   Send the configuration to the ESP32.
9.  **Completion:** A success message is displayed. The ESP32 will reboot and attempt to connect to the configured Wi-Fi network.

### Command-Line Arguments (Optional)

You can provide some information via command-line arguments to speed up the process:

*   `--token <YOUR_AUTH_TOKEN>`: Pre-fill the employee authentication token.
*   `--business-id <BUSINESS_ID>`: Pre-fill the business ID.
*   `--location "<DEVICE_LOCATION>"`: Pre-fill the device location (use quotes if it contains spaces).
*   `--ssid <WIFI_SSID>`: Pre-fill the Wi-Fi SSID.

**Example:**

```bash
python main.py --token mysecrettoken --business-id 123 --location "Office Entrance" --ssid MyCompanyWiFi
```

The script will skip prompting for any information provided via arguments.

## Configuration Constants

The script uses the following constants defined at the top of `main.py`:

*   `COMMUNICATION_NODE_ADDRESS`: URL of the backend server (Default: `http://localhost:5000`).
*   `ESP32_DEVICE_ADDRESS`: URL of the ESP32 in AP mode (Default: `http://192.168.4.1:80`).
*   `ESP32_DEFAULT_SSID`: Default SSID broadcast by the ESP32 (Default: `ESP32`).
*   `ESP32_DEFAULT_PASSWORD`: Default password for the ESP32's AP (Default: `admin1234`).
*   `REQUEST_TIMEOUT`: Timeout in seconds for HTTP requests (Default: `10`).

Modify these in `main.py` if your environment differs from the defaults.

## Backup File

A backup of the final configuration sent to the device (including the generated API key) is saved as `config_backup.json` in the `configurator` directory upon successful completion.
