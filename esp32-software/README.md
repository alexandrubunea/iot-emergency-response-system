# ESP32 IoT Emergency Response System Software

## Overview

This part of the project implements the firmware for an ESP32-based IoT device designed for emergency detection and response. It monitors various environmental sensors (motion, sound, fire, gas), detects potential emergencies based on configurable thresholds and trigger logic, and reports these events (alerts, malfunctions, logs) to a central backend server using HTTP POST requests.

The firmware utilizes the ESP-IDF framework and includes features for Wi-Fi connectivity, configuration management via a web server in Access Point mode, and persistent storage of settings using Non-Volatile Storage (NVS).

## Features

*   **Wi-Fi Connectivity:** Supports both Station (STA) mode to connect to an existing Wi-Fi network and Access Point (AP) mode for initial configuration.
*   **Web-based Configuration:** Provides a simple HTTP server in AP mode (`http://192.168.4.1`) to receive initial configuration (Wi-Fi credentials, backend API key, sensor enable flags).
*   **Persistent Configuration:** Stores settings (Wi-Fi SSID/Password, API Key, sensor flags) in NVS flash memory.
*   **Sensor Integration:**
    *   **Motion Sensor:** Detects motion using a digital input (e.g., HC-SR501 PIR sensor).
    *   **Sound Sensor:** Detects sound events using a digital input module.
    *   **Fire Sensor:** Detects flame presence using an analog input module.
    *   **Gas Sensor:** Detects gas presence using an analog input module (includes a 15-minute warm-up period).
*   **I2C Communication:** Uses I2C to communicate with INA219 sensors.
*   **Power/Current Monitoring:** Utilizes INA219 sensors to monitor the power consumption of the Sound, Fire, and Gas sensors for malfunction detection.
*   **Backend Communication:** Sends alerts, logs, and malfunction reports to a backend server (hardcoded as `http://192.168.1.132:5000`) via HTTP POST requests, authenticated with an API key.
*   **Debouncing/Multi-Trigger Logic:** Requires sensors to trigger multiple times consecutively before sending an alert to reduce false positives.

## Hardware Requirements

Based on the configuration in `main/main.c` and component usage:

*   ESP32 Development Board (e.g., ESP32-DevKitC)
*   Motion Sensor (Digital Output) connected to **GPIO 13**
*   Sound Sensor Module (Digital Output) connected to **GPIO 27**
*   Fire/Flame Sensor Module (Analog Output) connected to **GPIO 35**
*   Gas Sensor Module (Analog Output, e.g., MQ-series) connected to **GPIO 34**
*   4x INA219 Current Sensor Modules connected to I2C (**SCL: GPIO 22**, **SDA: GPIO 21**). Assumed I2C addresses based on `main.c`:
    *   Motion Sensor Monitor: **0x45**
    *   Sound Sensor Monitor: **0x41**
    *   Fire Sensor Monitor: **0x40**
    *   Gas Sensor Monitor: **0x44**
*   Appropriate Power Supply (capable of handling ESP32 and all sensors)
*   Wiring (Dupont cables, breadboard, etc.)

## Software Setup & Building

### Prerequisites

*   Espressif IoT Development Framework (ESP-IDF) - Ensure it's installed and configured correctly.
*   CMake & Ninja (or Make) build tools.
*   Git

### Steps

1.  **Clone the repository:**
    ```bash
    git clone <your-repo-url>
    cd <your-repo-folder>/iot-emergency-response-system
    ```
2.  **Navigate to firmware directory:**
    ```bash
    cd esp32-software
    ```
3.  **Configure (Optional):**
    Review project settings if needed, though defaults should work for standard ESP32 boards.
    ```bash
    idf.py menuconfig
    ```
4.  **Build:**
    ```bash
    idf.py build
    ```
5.  **Flash:**
    Connect your ESP32 board via USB. Find its serial port identifier (e.g., `COM3` on Windows, `/dev/ttyUSB0` on Linux).
    ```bash
    idf.py -p <YOUR_SERIAL_PORT> flash
    ```
    Replace `<YOUR_SERIAL_PORT>` with the actual port.
6.  **Monitor:**
    View serial output for logs and status messages.
    ```bash
    idf.py -p <YOUR_SERIAL_PORT> monitor
    ```
    (Press `Ctrl+]` to exit the monitor).

## Configuration

### First Boot (AP Mode)
`Use this method if you don't want to use the configurator found in the <configurator> folder`

1.  When the device is flashed and booted for the first time (or if NVS is erased), it enters Access Point mode.
2.  Using your phone or computer, connect to the Wi-Fi network:
    *   **SSID:** `ESP32`
    *   **Password:** `admin1234`
3.  The ESP32's IP address in this mode is `192.168.4.1`.

### Sending Configuration via HTTP POST

1.  While connected to the `ESP32` network, send an HTTP POST request to `http://192.168.4.1/api/config`.
2.  The request body **must** be in JSON format and include the following fields:
    *   `api_key` (string): The API key required by your backend server.
    *   `ssid` (string): The SSID (name) of your local Wi-Fi network.
    *   `password` (string): The password for your local Wi-Fi network.
    *   `motion` (integer/boolean): `1` (or `true`) to enable the motion sensor, `0` (or `false`) to disable.
    *   `sound` (integer/boolean): `1` (or `true`) to enable the sound sensor, `0` (or `false`) to disable.
    *   `gas` (integer/boolean): `1` (or `true`) to enable the gas sensor, `0` (or `false`) to disable.
    *   `fire` (integer/boolean): `1` (or `true`) to enable the fire sensor, `0` (or `false`) to disable.

3.  **Example using `curl`:**
    ```bash
    curl -X POST -H "Content-Type: application/json" -d '{
      "api_key": "YOUR_SECRET_API_KEY",
      "ssid": "MyHomeWiFi",
      "password": "MyWiFiPassword",
      "motion": 1,
      "sound": 1,
      "gas": 1,
      "fire": 1
    }' http://192.168.4.1/api/config
    ```
    Replace the example values with your actual configuration.

4.  You can check if the configuration server is running by accessing `http://192.168.4.1/api/check` in a browser or via `curl`. It should return `{"status": "sucesss"}`.

### Reboot and STA Mode

1.  Upon receiving a valid configuration via the POST request, the ESP32 saves the settings to NVS.
2.  It then logs a message indicating it will reboot shortly (after a 5-second delay).
3.  After rebooting, the ESP32 will automatically attempt to connect to the Wi-Fi network specified in the configuration (STA mode) and begin normal operation.

## Operation

1.  **Connection:** The device connects to the configured Wi-Fi network.
2.  **Initialization:** Initializes enabled sensors. The Gas sensor enters a 15-minute warm-up period before active monitoring begins. A log message is sent to the backend upon successful boot.
3.  **Monitoring:** Active sensors continuously monitor their inputs.
4.  **Alert Triggering:** If a sensor detects an event exceeding its threshold for the configured number of `times_to_trigger`, an alert is sent via HTTP POST to `http://192.168.1.132:5000/api/send_alert`. The payload indicates the alert type (e.g., `{"alert_type": "fire_alert"}`).
5.  **Malfunction Detection:** The Sound, Fire, and Gas sensor components monitor their power consumption using the INA219. If consumption drops below predefined thresholds (indicating a potential hardware issue), a malfunction report is sent via HTTP POST to `http://192.168.1.132:5000/api/send_malfunction`. The payload indicates the malfunction type (e.g., `{"malfunction_type": "gas_sensor", "message": "Power consumption is too low..."}`).
6.  **Logging:** General logs (like boot, sensor warm-up completion) are sent via HTTP POST to `http://192.168.1.132:5000/api/send_log`.
`This address should be changed depending on the host for <communication-node>`

## Code Structure

*   **`main/`**: Contains the main application logic (`main.c`) including initialization, boot sequence, sensor setup, and the main task loop. Also includes the project's main `CMakeLists.txt`.
*   **`components/`**: Contains reusable ESP-IDF components:
    *   `config_server/`: HTTP server for initial configuration.
    *   `config_storage/`: NVS management for storing configuration.
    *   `current_monitor/`: Wrapper for INA219 initialization and data reading.
    *   `fire_sensor/`: Fire sensor specific task and initialization logic.
    *   `gas_sensor/`: Gas sensor specific task, initialization, and warm-up logic.
    *   `ina219/`: Driver for the INA219 current/power sensor.
    *   `motion_sensor/`: Motion sensor specific task and initialization logic.
    *   `sensor/`: Generic sensor structure and functions (digital/analog reading, trigger logic).
    *   `sound_sensor/`: Sound sensor specific task and initialization logic.
    *   `utils/`: Utility functions for sending HTTP requests (alerts, logs, malfunctions) to the backend.
    *   `wifi_manager/`: Wi-Fi connection handling (STA and AP modes).
*   **`CMakeLists.txt` (root):** Top-level CMake file defining the project name and ESP-IDF requirements.
*   **`.gitignore`**: Specifies files/directories to be ignored by Git.
*   **`.clang-format`**: Defines code formatting rules.

## Customization

Several parameters can be adjusted directly in the source code:

*   **Sensor Pins & Thresholds:** Default GPIOs, analog thresholds, digital/analog mode, and `times_to_trigger` are defined in `main/main.c`.
*   **Default AP Credentials:** SSID (`WIFI_AP_SSID`) and Password (`WIFI_AP_PASS`) for the initial configuration AP are in `main/main.c`.
*   **I2C Pins:** `I2C_MASTER_SCL_IO` and `I2C_MASTER_SDA_IO` are defined in `main/main.c`.
*   **Backend Server IP:** The target IP address for alerts/logs (`192.168.1.132:5000`) is hardcoded in `components/utils/utils.c`.
*   **INA219 Settings:** Shunt resistance (`INA219_SHUNT_OHMS`) and max expected current (`INA219_MAX_EXPECTED_AMP`) used for calibration are in `components/current_monitor/current_monitor.c`.
*   **Gas Sensor Warm-up:** Duration (`GAS_SENSOR_WARMUP_MINUTES`) is defined in `components/gas_sensor/gas_sensor.c`.
*   **Malfunction Thresholds:** Power/current thresholds for malfunction detection are set within the respective sensor event tasks (`sound_sensor_event`, `fire_sensor_event`, `gas_sensor_event`).

Remember to rebuild (`idf.py build`) and reflash (`idf.py flash`) after making code changes.

## Troubleshooting

*   Use the serial monitor (`idf.py monitor`) extensively to check for boot logs, Wi-Fi connection status, sensor readings, alert triggers, and error messages from ESP-IDF and the application components.
*   Verify hardware connections carefully, especially I2C wiring and sensor pin assignments.
*   Ensure the backend server at `192.168.1.132:5000 (or de address set by you)` is running and accessible from the ESP32's network.
*   Check the API key used during configuration matches the one expected by the backend.
*   During AP mode configuration, ensure the JSON payload sent via POST is correctly formatted and contains all required fields.
*   If the device fails to connect to Wi-Fi after configuration, double-check the SSID and password provided.
*   If sensors report malfunctions immediately, check their power supply and the INA219 connections/addresses.
