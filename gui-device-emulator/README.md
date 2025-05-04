# IoT Device GUI Emulator

## Overview

This graphical user interface (GUI) tool provides an alternative to the command-line interface for emulating the API calls made by both the ESP32 devices and the `configurator` tool to the `communication-node` backend server.

Built with Tkinter, it offers a user-friendly way to manually trigger specific API endpoints (like device registration, sending alerts/malfunctions/logs, checking business existence) and inspect the responses from the backend. This is useful for testing the `communication-node` functionality without requiring the physical hardware or other software components.

## Features

*   **Modern GUI Interface:** Clean and intuitive graphical interface for all operations
*   **API Call Simulation:**
    *   Emulates `configurator` calls: `/api/register_device`, `/api/business_exists/<id>`, `/api/validate_employee_auth_token`
    *   Emulates ESP32 device calls: `/api/send_alert`, `/api/send_malfunction`, `/api/send_log`
*   **Dynamic Input Forms:** Context-sensitive input fields that change based on the selected API call
*   **API Key Management:** Separate fields for configurator actions (Level 1) and device actions (Level 2)
*   **Detailed Logging:** Real-time display of request and response details in a scrollable log window
*   **Response Formatting:** Automatically formats and displays response data (status code, headers, JSON/text body)
*   **Error Handling:** Clear error messages and user feedback for failed requests
*   **Standard Libraries:** Uses standard Python libraries and `requests` (implicitly expected)

## Requirements

*   Python 3.x
*   Tkinter (usually comes with Python installation)
*   `requests` library (Install using `pip install requests` if not already present)

## Usage

1.  **Ensure Backend is Running:** Make sure the `communication-node` Flask backend server is running and accessible from where you run the emulator.

2.  **Navigate to Directory:**
    ```bash
    cd path/to/iot-emergency-response-system/gui-device-emulator
    ```

3.  **Run the Application:**
    ```bash
    python main.py
    ```

4.  **Initial Setup:**
    *   Enter the **Base URL** of the `communication-node` (default: `http://localhost:5000`)
    *   Enter the **Configurator API Key (Level 1)** - needed for configurator actions
    *   Enter the **Device API Key (Level 2)** - needed for device actions
    *   You can generate these keys using the `communication-node`'s `setup/generate_api_key.py` script

5.  **Using the Interface:**
    *   The window is divided into several sections:
        *   **Settings Panel:** Configure Base URL and API keys
        *   **Configurator Calls:** Buttons for Level 1 API calls
        *   **Device Calls:** Buttons for Level 2 API calls
        *   **Dynamic Input Panel:** Changes based on selected API call
        *   **Log Window:** Shows request and response details

6.  **Making API Calls:**
    *   Click on any API call button (e.g., "Register Device", "Send Alert")
    *   Fill in the required fields that appear in the Dynamic Input Panel
    *   Click "Execute Request" to send the API call
    *   View the request and response details in the Log Window

7.  **Available API Calls:**
    *   **Configurator Calls (Level 1):**
        *   Register Device
        *   Check Business Exists
        *   Validate Employee Token
    *   **Device Calls (Level 2):**
        *   Send Alert
        *   Send Malfunction
        *   Send Log

## Notes

*   The application does not persist settings between runs; you need to enter the Base URL and API keys each time you start the application
*   Ensure the API keys you provide have the correct access level for the actions you are trying to simulate (Level 1 for configurator calls, Level 2 for device calls)
*   If you register a new device, the application will suggest the generated API key. You might want to update the 'Device Key (L2)' setting to use this new key if you intend to immediately simulate alerts/logs from that newly registered device
*   The log window can be cleared using the "Clear Log" button
*   All API calls are made with a 30-second timeout
