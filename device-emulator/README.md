# IoT Device Emulator

## Overview

This command-line tool provides an interactive way to emulate the API calls made by both the ESP32 devices and the `configurator` tool to the `communication-node` backend server.

It allows developers to manually trigger specific API endpoints (like device registration, sending alerts/malfunctions/logs, checking business existence) and inspect the responses from the backend. This is useful for testing the `communication-node` functionality without requiring the physical hardware or other software components.

## Features

*   **Interactive Menu:** Simple text-based menu for selecting which API call to emulate.
*   **API Call Simulation:**
    *   Emulates `configurator` calls: `/api/register_device`, `/api/business_exists/<id>`, `/api/validate_employee_auth_token`.
    *   Emulates ESP32 device calls: `/api/send_alert`, `/api/send_malfunction`, `/api/send_log`.
*   **User Input:** Prompts for necessary information like Business IDs, device details, alert/malfunction types, and messages.
*   **API Key Management:** Prompts for and uses separate API keys for configurator actions (Level 1) and device actions (Level 2).
*   **Clear Output:** Displays details of the request being sent and formats the response (status code, headers, JSON/text body) for easy inspection.
*   **Standard Libraries:** Uses standard Python libraries and `requests` (implicitly expected).

## Requirements

*   Python 3.x
*   `requests` library (Install using `pip install requests` if not already present).

## Usage

1.  **Ensure Backend is Running:** Make sure the `communication-node` Flask backend server is running and accessible from where you run the emulator.
2.  **Navigate to Directory:**
    ```bash
    cd path/to/iot-emergency-response-system/device-emulator
    ```
3.  **Run the Script:**
    ```bash
    python main.py
    ```
4.  **Initial Setup:**
    *   The script will first ask for the **Base URL** of the `communication-node` (e.g., `http://localhost:5000`).
    *   It will then ask for the **Configurator API Key (Level 1)**. This key is needed to simulate actions performed by the `configurator` tool (like registering a device).
    *   Finally, it will ask for the **Device API Key (Level 2)**. This key is needed to simulate actions performed by an ESP32 device (like sending alerts).
    *   You can generate these keys using the `communication-node`'s `setup/generate_api_key.py` script.
5.  **Main Menu:**
    After setup, a menu will appear:
    ```
    --- Device Emulator Menu ---
    1. Set API Base URL
    2. Set Configurator API Key (Level 1)
    3. Set Device API Key (Level 2)
    -----------------------------
    4. Simulate: Register Device
    5. Simulate: Check Business Exists
    6. Simulate: Validate Employee Token
    -----------------------------
    7. Simulate: Send Alert
    8. Simulate: Send Malfunction
    9. Simulate: Send Log
    -----------------------------
    0. Exit
    ```
6.  **Select Action:** Enter the number corresponding to the API call you want to simulate.
7.  **Follow Prompts:** The script will prompt for any additional information needed for the selected API call (e.g., alert type, message, business ID).
8.  **View Results:** The script will print the details of the HTTP request it sends and the response received from the `communication-node` backend.
9.  **Repeat or Exit:** You can continue selecting actions from the menu or choose `0` to exit.

## Notes

*   This tool does not persist the Base URL or API keys between runs; you need to enter them each time you start the script (or modify the script to load them from a file/environment variables if desired).
*   Ensure the API keys you provide have the correct access level for the actions you are trying to simulate (Level 1 for options 4-6, Level 2 for options 7-9).
*   If you simulate registering a new device (Option 4), the script will suggest the generated API key. You might want to update the 'Device API Key' (Option 3) in the emulator to use this new key if you intend to immediately simulate alerts/logs from that newly registered device.
