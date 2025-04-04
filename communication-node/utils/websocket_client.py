"""
WebSocket client for sending alerts to the Express server.
This client uses the Socket.IO library to establish a connection with the server.
"""

import os
import logging
import socketio

logger = logging.getLogger("socketio_client")
logger.setLevel(logging.INFO)

file_handler = logging.FileHandler("socketio_client.log")
file_handler.setLevel(logging.INFO)

formatter = logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")
file_handler.setFormatter(formatter)

if not logger.hasHandlers():
    logger.addHandler(file_handler)


class SocketIOClient:
    """
    Singleton class for managing Socket.IO client connections.
    This class is responsible for connecting to the Socket.IO server,
    emitting events, and handling reconnections.
    """

    _instance = None
    _initialized = False

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(SocketIOClient, cls).__new__(cls)
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self._initialized = True

        self.express_socket_url = os.getenv("EXPRESS_APP_HOST")
        self.socket_secret_key = os.getenv("EXPRESS_APP_KEY")
        self.sio = socketio.Client()
        self.connect()

    def connect(self):
        """Attempt to connect/reconnect to the Socket.IO server."""
        if self.sio.connected:
            return
        try:
            self.sio.connect(
                self.express_socket_url,
                auth={"token": self.socket_secret_key},
                transports=["websocket"],
            )
            logger.info("Connected to %s successfully.", self.express_socket_url)
        except socketio.exceptions.ConnectionError as e:
            logger.error("Socket connection failed: %s", e)

    def emit_new_alert(self, alert_data):
        """Send a secure alert event to the Express server."""
        if not self.sio.connected:
            logger.info("SocketIO client is not connected. Attempting to reconnect...")
            try:
                self.connect()
            except Exception as e:
                logger.error("Failed to reconnect: %s", e)
                return

        logger.info("Emitting new alert...")
        self.sio.emit("new-alert", alert_data)

    def emit_new_malfunction(self, malfunction_data):
        """Send a secure malfunction event to the Express server."""
        if not self.sio.connected:
            logger.info("SocketIO client is not connected. Attempting to reconnect...")
            try:
                self.connect()
            except Exception as e:
                logger.error("Failed to reconnect: %s", e)
                return

        logger.info("Emitting new malfunction...")
        self.sio.emit("new-malfunction", malfunction_data)

    def emit_new_log(self, log_data):
        """Send a secure log event to the Express server."""
        if not self.sio.connected:
            logger.info("SocketIO client is not connected. Attempting to reconnect...")
            try:
                self.connect()
            except Exception as e:
                logger.error("Failed to reconnect: %s", e)
                return

        logger.info("Emitting new log...")
        self.sio.emit("new-device_log", log_data)
