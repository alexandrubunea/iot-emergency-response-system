# Dashboard - IoT Emergency Response System Frontend & Real-time Server

## Overview

This component provides the web-based user interface (dashboard) for monitoring and managing the IoT Emergency Response System. It displays real-time information about businesses, devices, alerts, and malfunctions.

It consists of two main parts:

1.  **Frontend:** A single-page application (SPA) built with React, Vite, TypeScript, and Tailwind CSS. It fetches data from and sends commands to its backend component.
2.  **Backend (Express/Socket.IO Server):** A Node.js server built with Express and Socket.IO, written in TypeScript. This server serves the static frontend files, acts as a secure API gateway/proxy to the main `communication-node` (Python backend), and handles real-time communication using WebSockets.

## Features

*   **React Frontend (Vite + TypeScript):** Modern, fast frontend stack.
*   **Tailwind CSS:** Utility-first CSS framework for rapid UI development.
*   **Real-time Updates:** Uses Socket.IO to receive and display live alerts, malfunctions, and logs as they happen.
*   **Data Visualization:**
    *   Displays businesses, devices, and their status.
    *   Tabular views for alerts, malfunctions, and device logs.
    *   Interactive map view (Leaflet) showing business locations.
    *   Dashboard statistics and charts (Chart.js).
*   **Data Management:** Allows users to add/delete businesses and employees, and resolve alerts/malfunctions.
*   **API Gateway (Express Server):** Proxies API requests securely from the frontend to the `communication-node` backend, hiding the backend URL and managing API key authentication.
*   **WebSocket Server (Socket.IO):** Receives events from the `communication-node` and broadcasts them to connected dashboard clients.

## Project Structure

*   **`public/`**: Static assets served directly.
*   **`src/`**: Frontend React application source code.
    *   `main.tsx`: Main entry point for the React app.
    *   `App.tsx`: Root React component, sets up layout and routing logic.
    *   `index.css`: Global styles and Tailwind CSS imports.
    *   `components/`: Reusable React UI components (e.g., Sidebar, Modals, Tables).
    *   `views/`: Top-level components representing different dashboard pages (Home, Map, Businesses, Employees, LogsView/*).
    *   `utils/`: Frontend utility functions.
    *   `models/` / `types/`: TypeScript type definitions.
*   **`server.ts`**: Backend Express/Socket.IO server implementation.
*   **`routes/`**: Backend route handlers (acting as proxies to the `communication-node`).
*   **`utils/` (root level)**: Backend utility functions.
*   **`vite.config.ts`**: Vite build configuration.
*   **`tailwind.config.js`**: Tailwind CSS configuration (likely, though not explicitly listed, standard for Tailwind setup).
*   **`tsconfig.*.json`**: TypeScript configuration files.
*   **`package.json`**: Project metadata, dependencies, and scripts.
*   **`.env.example`**: (Assumed existence based on code) Example environment variables for the backend server.
*   **`.gitignore`**: Specifies files/directories ignored by Git.
*   **`dist/`**: (Generated after build) Contains the built frontend static files and the compiled backend server code.

## Setup and Installation

### Prerequisites

*   Node.js (includes npm)
*   The `communication-node` backend server must be running and accessible.

### Steps

1.  **Navigate to the dashboard directory:**
    ```bash
    cd path/to/iot-emergency-response-system/dashboard
    ```
2.  **Install Dependencies:**
    ```bash
    npm install
    ```
3.  **Configure Environment Variables:**
    *   Copy or rename `.env.example` to `.env` in the `dashboard` directory.
    *   Edit the `.env` file and provide the necessary values for the **Express/Socket.IO server**:
        *   `PORT`: Port for the dashboard server to run on (e.g., `4000`).
        *   `COMMUNICATION_NODE_HOST`: Full URL of the running `communication-node` Flask backend (e.g., `http://localhost:5000`).
        *   `COMMUNICATION_NODE_API_KEY`: A valid API key with Access Level 0 (generated using the `communication-node`'s `setup/generate_api_key.py` script) that this server will use to talk to the Flask backend.
        *   `EXPRESS_SOCKET_SECRET_KEY`: A secret key that the `communication-node` Flask backend will use to authenticate when connecting to *this* Socket.IO server.
        *   `EXPRESS_VITE_API_URL`: The URL where the frontend (running via Vite dev server or served statically) will be accessible (e.g., `http://localhost:5173` for default Vite dev, or `http://localhost:4000` if served by this Express app in production).
        *   `VITE_EXPRESS_API_URL`: The URL the *frontend code* will use to make API calls to *this* Express server (e.g., `http://localhost:4000`). This is often exposed to the frontend via Vite's env handling.

## Development

To run the dashboard in development mode (with hot-reloading for frontend changes and automatic server restarts):

```bash
npm run dev
```

This command concurrently starts:
1.  The Vite development server for the React frontend (typically on `http://localhost:5173`).
2.  The Express/Socket.IO server (`server.ts`) using `tsx` (typically on the `PORT` specified in `.env`, e.g., `http://localhost:4000`).

Access the dashboard via the Vite dev server URL (e.g., `http://localhost:5173`). API calls and WebSocket connections from the frontend will target the Express server (e.g., `http://localhost:4000`).

## Production Build

1.  **Build the application:**
    ```bash
    npm run build
    ```
    This command compiles the TypeScript server code and builds the static React frontend assets into the `dist` directory.

2.  **Start the server:**
    ```bash
    npm start
    ```
    This runs the compiled Node.js server (`dist/server.js`), which serves the static frontend files and handles API proxying and WebSocket connections. Access the dashboard on the `PORT` specified in your `.env` file (e.g., `http://localhost:4000`).

## Notes

*   Ensure the environment variables in `.env` are correctly configured, especially the URLs for the `communication-node` and the dashboard itself, and the necessary API/secret keys.

## Overview

This component provides the web-based user interface (dashboard) for monitoring and managing the IoT Emergency Response System. It displays real-time information about businesses, devices, alerts, and malfunctions.

It consists of two main parts:

1.  **Frontend:** A single-page application (SPA) built with React, Vite, TypeScript, and Tailwind CSS. It fetches data from and sends commands to its backend component.
2.  **Backend (Express/Socket.IO Server):** A Node.js server built with Express and Socket.IO, written in TypeScript. This server serves the static frontend files, acts as a secure API gateway/proxy to the main `communication-node` (Python backend), and handles real-time communication using WebSockets.

## Features

*   **React Frontend (Vite + TypeScript):** Modern, fast frontend stack.
*   **Tailwind CSS:** Utility-first CSS framework for rapid UI development.
*   **Real-time Updates:** Uses Socket.IO to receive and display live alerts, malfunctions, and logs as they happen.
*   **Data Visualization:**
    *   Displays businesses, devices, and their status.
    *   Tabular views for alerts, malfunctions, and device logs.
    *   Interactive map view (Leaflet) showing business locations.
    *   Dashboard statistics and charts (Chart.js).
*   **Data Management:** Allows users to add/delete businesses and employees, and resolve alerts/malfunctions.
*   **API Gateway (Express Server):** Proxies API requests securely from the frontend to the `communication-node` backend, hiding the backend URL and managing API key authentication.
*   **WebSocket Server (Socket.IO):** Receives events from the `communication-node` and broadcasts them to connected dashboard clients.

## Project Structure

*   **`public/`**: Static assets served directly.
*   **`src/`**: Frontend React application source code.
    *   `main.tsx`: Main entry point for the React app.
    *   `App.tsx`: Root React component, sets up layout and routing logic.
    *   `index.css`: Global styles and Tailwind CSS imports.
    *   `components/`: Reusable React UI components (e.g., Sidebar, Modals, Tables).
    *   `views/`: Top-level components representing different dashboard pages (Home, Map, Businesses, Employees, LogsView/*).
    *   `utils/`: Frontend utility functions.
    *   `models/` / `types/`: TypeScript type definitions.
*   **`server.ts`**: Backend Express/Socket.IO server implementation.
*   **`routes/`**: Backend route handlers (acting as proxies to the `communication-node`).
*   **`utils/` (root level)**: Backend utility functions.
*   **`vite.config.ts`**: Vite build configuration.
*   **`tailwind.config.js`**: Tailwind CSS configuration (likely, though not explicitly listed, standard for Tailwind setup).
*   **`tsconfig.*.json`**: TypeScript configuration files.
*   **`package.json`**: Project metadata, dependencies, and scripts.
*   **`.env.example`**: (Assumed existence based on code) Example environment variables for the backend server.
*   **`.gitignore`**: Specifies files/directories ignored by Git.
*   **`dist/`**: (Generated after build) Contains the built frontend static files and the compiled backend server code.

## Setup and Installation

### Prerequisites

*   Node.js (includes npm)
*   The `communication-node` backend server must be running and accessible.

### Steps

1.  **Navigate to the dashboard directory:**
    ```bash
    cd path/to/iot-emergency-response-system/dashboard
    ```
2.  **Install Dependencies:**
    ```bash
    npm install
    ```
3.  **Configure Environment Variables:**
    *   Copy or rename `.env.example` to `.env` in the `dashboard` directory.
    *   Edit the `.env` file and provide the necessary values for the **Express/Socket.IO server**:
        *   `PORT`: Port for the dashboard server to run on (e.g., `4000`).
        *   `COMMUNICATION_NODE_HOST`: Full URL of the running `communication-node` Flask backend (e.g., `http://localhost:5000`).
        *   `COMMUNICATION_NODE_API_KEY`: A valid API key with Access Level 0 (generated using the `communication-node`'s `setup/generate_api_key.py` script) that this server will use to talk to the Flask backend.
        *   `EXPRESS_SOCKET_SECRET_KEY`: A secret key that the `communication-node` Flask backend will use to authenticate when connecting to *this* Socket.IO server.
        *   `EXPRESS_VITE_API_URL`: The URL where the frontend (running via Vite dev server or served statically) will be accessible (e.g., `http://localhost:5173` for default Vite dev, or `http://localhost:4000` if served by this Express app in production).
        *   `VITE_EXPRESS_API_URL`: The URL the *frontend code* will use to make API calls to *this* Express server (e.g., `http://localhost:4000`). This is often exposed to the frontend via Vite's env handling.

## Development

To run the dashboard in development mode (with hot-reloading for frontend changes and automatic server restarts):

```bash
npm run dev
```

This command concurrently starts:
1.  The Vite development server for the React frontend (typically on `http://localhost:5173`).
2.  The Express/Socket.IO server (`server.ts`) using `tsx` (typically on the `PORT` specified in `.env`, e.g., `http://localhost:4000`).

Access the dashboard via the Vite dev server URL (e.g., `http://localhost:5173`). API calls and WebSocket connections from the frontend will target the Express server (e.g., `http://localhost:4000`).

## Production Build

1.  **Build the application:**
    ```bash
    npm run build
    ```
    This command compiles the TypeScript server code and builds the static React frontend assets into the `dist` directory.

2.  **Start the server:**
    ```bash
    npm start
    ```
    This runs the compiled Node.js server (`dist/server.js`), which serves the static frontend files and handles API proxying and WebSocket connections. Access the dashboard on the `PORT` specified in your `.env` file (e.g., `http://localhost:4000`).

## Notes

*   Ensure the environment variables in `.env` are correctly configured, especially the URLs for the `communication-node` and the dashboard itself, and the necessary API/secret keys.
*   The Express server acts as a crucial intermediary. The React frontend **does not** directly communicate with the `communication-node` (Flask backend).
