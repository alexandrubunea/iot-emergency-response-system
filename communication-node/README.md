# Communication Node - IoT Emergency Response System Backend

## Overview

This component is the central backend server for the IoT Emergency Response System. It acts as the communication hub between the ESP32 sensor devices, the device configurator tool, and the frontend dashboard.

Built with Flask (Python), it provides a RESTful API for device registration, data ingestion (alerts, malfunctions, logs), data retrieval for the dashboard, and system management. It utilizes a PostgreSQL database for persistent storage and interacts with a separate real-time server (likely Node.js/Express via Socket.IO) to push live updates to the dashboard.

## Features

*   **Flask Framework:** Robust and lightweight web framework.
*   **PostgreSQL Database:** Stores all system data (businesses, devices, employees, API keys, alerts, etc.). Managed via `psycopg2` and a connection pool (`utils/db.py`).
*   **RESTful API:**
    *   Endpoints for the `configurator` tool to register new devices.
    *   Endpoints for ESP32 devices to send alerts, malfunctions, and logs.
    *   Endpoints for the dashboard to fetch data, manage entities (businesses, employees, devices), and resolve alerts/malfunctions.
*   **API Key Authentication:** Secures API endpoints using bearer tokens with different access levels (Dashboard/Admin: 0, Configurator/Employee: 1, Device: 2).
*   **Real-time Communication:** Connects to a separate WebSocket server (via `python-socketio`) to emit events for new alerts, malfunctions, and logs, enabling live dashboard updates.
*   **Environment Variable Configuration:** Uses `.env` files (`python-dotenv`) for sensitive configuration like database credentials and WebSocket server details.
*   **Database Setup Scripts:** Includes scripts to initialize the database schema (`setup/init_db.py`) and generate initial API keys (`setup/generate_api_key.py`).
*   **Logging:** Configured extensive logging for different components (app, database, auth, blueprints, etc.) into separate files (`app.log`, `database.log`, `auth_api.log`, `blueprints.log`, `socketio_client.log`, `setup.log`).

## Project Structure

*   **`app.py`**: Main Flask application entry point. Initializes Flask, database pool, logging, and registers blueprints.
*   **`requirements.txt`**: Lists Python package dependencies.
*   **`routes/`**: Contains Flask Blueprints defining API endpoints:
    *   `configurator.py`: Endpoints for device registration and validation used by the configurator tool.
    *   `device.py`: Endpoints for receiving data (alerts, malfunctions, logs) from ESP32 devices.
    *   `dashboard.py`: Endpoints for serving data to and receiving commands from the frontend dashboard.
*   **`utils/`**: Contains utility modules:
    *   `db.py`: `DatabaseManager` class for handling the PostgreSQL connection pool.
    *   `api_key.py`: `check_api_key` function for validating API keys against the database.
    *   `websocket_client.py`: `SocketIOClient` singleton for emitting events to the external real-time server.
*   **`decorators/`**: Contains custom decorators used in routes:
    *   `validate_auth.py`: `@validate_auth_header` for checking API key in headers.
    *   `validate_json_payload.py`: `@validate_json_payload` for ensuring required fields exist in JSON requests.
    *   `db_retry.py`: `@retry_on_db_error` for automatically retrying failed database operations.
*   **`setup/`**: Contains utility scripts for initial setup:
    *   `init_db.py`: Creates the necessary database tables and indices.
    *   `generate_api_key.py`: Generates API keys with specified access levels.
*   **`.env.example`**: (Assumed existence based on code) Example file showing required environment variables.
*   **`.gitignore`**: Standard Python gitignore file.
*   **Log Files**: (`*.log`) Generated during runtime.

## Setup and Installation

### Prerequisites

*   Python 3.x
*   `pip` (Python package installer)
*   PostgreSQL Server (running and accessible)
*   A separate real-time server (e.g., Node.js with Socket.IO) for dashboard updates (Optional, but needed for full functionality).

### Steps

1.  **Clone the repository (if not already done):**
    ```bash
    git clone <your-repo-url>
    cd <your-repo-folder>/iot-emergency-response-system/communication-node
    ```
2.  **Install Dependencies:**
    ```bash
    pip install -r requirements.txt
    ```
3.  **Configure Environment Variables:**
    *   Copy or rename `.env.example` to `.env`.
    *   Edit the `.env` file and provide the necessary values:
        *   `DATABASE_HOST`: Hostname or IP of your PostgreSQL server.
        *   `DATABASE_NAME`: Name of the database to use.
        *   `DATABASE_USER`: PostgreSQL username.
        *   `DATABASE_PASSWORD`: PostgreSQL password.
        *   `DATABASE_PORT`: Port PostgreSQL is running on (Default: `5432`).
        *   `DB_MIN_CONNECTIONS` (Optional): Minimum connections in the pool (Default: `1`).
        *   `DB_MAX_CONNECTIONS` (Optional): Maximum connections in the pool (Default: `10`).
        *   `DATABASE_TIMEOUT` (Optional): Connection timeout in seconds (Default: `30`).
        *   `EXPRESS_APP_HOST`: URL of the separate real-time/dashboard server (e.g., `http://localhost:4000`).
        *   `EXPRESS_APP_KEY`: Secret key required to authenticate with the real-time server.
4.  **Initialize Database:**
    *   Ensure the database specified in `.env` exists and the user has privileges.
    *   Run the initialization script:
        ```bash
        python setup/init_db.py
        ```
        This will create all the required tables.
5.  **Generate Initial API Key(s):**
    *   Generate at least one API key for accessing the dashboard (Access Level 0):
        ```bash
        python setup/generate_api_key.py --level 0 --description "Dashboard Admin Key"
        ```
    *   Store the generated key securely. You might need other keys (Level 1) for employees using the configurator tool.

## Running the Application

Execute the main Flask application file:

```bash
python app.py
```

The server will start, typically listening on `http://0.0.0.0:5000` (check console output). It will attempt to connect to the database and log status messages to `app.log` and other specific log files.

## API Access Levels

API keys control access to different parts of the system:

*   **Level 0 (Dashboard/Admin):** Can read all data (businesses, devices, alerts, etc.), manage businesses and employees, and resolve alerts/malfunctions. Used by the frontend dashboard.
*   **Level 1 (Configurator/Employee):** Can validate business IDs and register new devices. Used by the `configurator` tool.
*   **Level 2 (Device):** Can send alerts, malfunctions, and logs. Used by the ESP32 devices.

## Notes

*   This application relies on a separate server (referred to as "Express App" based on variable names) for handling real-time WebSocket communication with the frontend dashboard. Ensure this server is running and configured correctly.
*   Database credentials and the WebSocket server key are sensitive; manage the `.env` file securely.
*   Review log files (`*.log`) for detailed information and troubleshooting.
