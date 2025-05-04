# ESP32 Device GUI Configurator

## Overview

This graphical user interface (GUI) tool provides an alternative to the command-line interface for configuring ESP32 IoT Emergency Response System devices. Built with Tkinter, it offers a user-friendly way to perform the same configuration tasks as the command-line version.

The tool guides users through authenticating, validating business information, connecting to the device in AP mode, gathering necessary settings (Wi-Fi, sensors, location), generating a unique API key, registering the device with the backend communication node, and finally sending the configuration to the ESP32 itself.

## Features

*   Modern graphical user interface built with Tkinter
*   Real-time validation of inputs and immediate feedback
*   Progress tracking and status logging
*   Automatic connection detection to ESP32 device
*   Comprehensive configuration options:
    *   Business ID validation
    *   Device location specification
    *   Sensor capability selection (Motion, Gas, Sound, Fire)
    *   Wi-Fi network configuration
*   Secure API key generation
*   Automatic device registration with the backend communication node
*   Configuration backup saving option
*   Detailed error handling and user feedback

## Requirements

*   Python 3.x
*   `pip` (Python package installer)
*   Tkinter (usually comes with Python installation)
*   `requests` library for HTTP communication

## Installation

1.  **Navigate to the gui-configurator directory:**
    ```bash
    cd path/to/iot-emergency-response-system/gui-configurator
    ```
2.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```
    This will install the required packages.

## Usage

### Prerequisites

1.  The ESP32 device must be flashed with the firmware from the `esp32-software` directory and powered on for the first time (or after an NVS erase). It should be broadcasting the default AP:
    *   **SSID:** `ESP32`
    *   **Password:** `admin1234`
2.  The computer running this application must be connected to the `ESP32` Wi-Fi network.
3.  The backend communication node must be running and accessible from the computer running the application (default address `http://localhost:5000`).

### Running the Application

Execute the script from the `gui-configurator` directory:

```bash
python main.py
```

The application will open a window guiding you through the following steps:

1.  **Initial Setup:**
    *   Enter the Communication Node address (default: `http://localhost:5000`)
    *   Enter the ESP32 device address (default: `http://192.168.4.1:80`)
    *   Enter your Employee Authentication Token
    *   Click "Validate Token & Start"

2.  **Configuration Details:**
    *   Enter Business ID
    *   Specify Device Location
    *   Select enabled sensors (Motion, Gas, Sound, Fire)
    *   Enter target Wi-Fi network credentials (SSID and Password)

3.  **Configuration Process:**
    *   Click "Validate Inputs & Show Summary" to review settings
    *   Click "Confirm & Proceed with Configuration" to begin the process
    *   The application will:
        *   Generate an API key
        *   Register the device with the backend
        *   Connect to the ESP32
        *   Send the configuration to the device
    *   Progress and status updates are shown in the log window

4.  **Completion:**
    *   A success message is displayed when configuration is complete
    *   The ESP32 will reboot and attempt to connect to the configured Wi-Fi network

## Configuration Constants

The application uses the following constants defined at the top of `main.py`:

*   `DEFAULT_COMM_NODE`: URL of the backend server (Default: `http://localhost:5000`)
*   `DEFAULT_ESP32_ADDR`: URL of the ESP32 in AP mode (Default: `http://192.168.4.1:80`)
*   `ESP32_DEFAULT_SSID`: Default SSID broadcast by the ESP32 (Default: `ESP32`)
*   `ESP32_DEFAULT_PASSWORD`: Default password for the ESP32's AP (Default: `admin1234`)
*   `REQUEST_TIMEOUT`: Timeout in seconds for HTTP requests (Default: `10`)
*   `ESP32_CONNECT_ATTEMPTS`: Maximum number of connection attempts (Default: `20`)
*   `ESP32_CONNECT_WAIT_TIME_MS`: Wait time between connection attempts in milliseconds (Default: `3000`)

Modify these in `main.py` if your environment differs from the defaults.

## Backup File

When the "Save Backup" option is enabled, a backup of the final configuration (including the generated API key) is saved as a JSON file with the naming format:
`device_config_business{BUSINESS_ID}_{TIMESTAMP}.json`

The backup file is saved to a location of your choice through a file dialog.
