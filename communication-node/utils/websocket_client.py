# pylint: disable=wrong-import-order, wrong-import-position
# flake8: noqa: E402
"""
WebSocket client for sending alerts to the Express server.
This client uses the Socket.IO library to establish a connection with the server.
"""

import eventlet

eventlet.monkey_patch()

import os
from threading import Lock
import logging
import sys
import socketio

logger = logging.getLogger("websocket_client")
logger.setLevel(logging.INFO)

stream_handler = logging.StreamHandler(sys.stderr)
stream_handler.setLevel(logging.INFO)

formatter = logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")
stream_handler.setFormatter(formatter)

if not logger.hasHandlers():
    logger.addHandler(stream_handler)


class SocketIOClient:
    """
    Singleton Socket.IO Client.
    Sends (emits) data only.
    """

    _instance = None
    _initialized = False
    _lock = Lock()

    def __new__(cls):
        """Ensure only one instance of SocketIOClient exists."""
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(SocketIOClient, cls).__new__(cls)
                cls._instance._initialized = False
            return cls._instance

    def __init__(self):
        """Initialize the SocketIOClient instance."""
        if self._initialized:
            return

        self.express_socket_url = os.getenv("EXPRESS_APP_HOST", "http://localhost:5000")
        self.socket_secret_key = os.getenv("EXPRESS_APP_KEY", "dev-key")

        # Force sync/threading mode
        self.sio = socketio.Client(async_mode="threading")
        self._connect()

        self._initialized = True

    def _connect(self):
        """Establish the connection if not already connected."""
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
            logger.error("Connection failed: %s", e)

    def _safe_emit(self, event, data):
        """Emit an event safely, reconnecting if necessary."""
        if not self.sio.connected:
            logger.info("SocketIO client not connected. Reconnecting...")
            self._connect()
            if not self.sio.connected:
                logger.error("Emit failed: still not connected.")
                return
        try:
            self.sio.emit(event, data)
            logger.info("Emitted event %s: %s", event, data)
        except Exception as e:
            logger.error("Emit error for %s: %s", event, e)

    def emit_new_alert(self, alert_data):
        """Emit a new alert event with the provided data."""
        self._safe_emit("new-alert", alert_data)

    def emit_new_malfunction(self, malfunction_data):
        """Emit a new malfunction event with the provided data."""
        self._safe_emit("new-malfunction", malfunction_data)

    def emit_new_log(self, log_data):
        """Emit a new device log event with the provided data."""
        self._safe_emit("new-device_log", log_data)
