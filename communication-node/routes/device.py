"""
Handles the communication between the database and the device endpoints.
"""

import logging
from datetime import datetime
from flask import Blueprint, jsonify, request
import psycopg2
from psycopg2 import sql

from decorators.validate_auth import validate_auth_header
from decorators.validate_json_payload import validate_json_payload
from utils.db import DatabaseManager
from utils.websocket_client import SocketIOClient

# Configure logging
logger = logging.getLogger("device_blueprint")
logger.setLevel(logging.INFO)

file_handler = logging.FileHandler("blueprints.log")
file_handler.setLevel(logging.INFO)

formatter = logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")
file_handler.setFormatter(formatter)

if not logger.hasHandlers():
    logger.addHandler(file_handler)

# Create Blueprint
device_bp = Blueprint("device", __name__)


def get_device_id_by_api_key(api_key):
    """
    Retrieve the device ID associated with the given API key.
    """
    connection = DatabaseManager.get_connection()

    try:
        with connection.cursor() as cur:
            cur.execute(
                sql.SQL(
                    """
                    SELECT id FROM security_devices
                    WHERE api_key_id = (SELECT id FROM api_keys
                    WHERE api_key = %s);
                    """
                ),
                (api_key,),
            )

            device_id = cur.fetchone()[0]
            return device_id
    except psycopg2.Error as e:
        logger.error("Error retrieving device ID by API key: %s", e)
        return None
    finally:
        DatabaseManager.release_connection(connection)


def get_device_name(device_id):
    """
    Retrieve the device name associated with the given device ID.
    """
    connection = DatabaseManager.get_connection()

    try:
        with connection.cursor() as cur:
            cur.execute(
                sql.SQL(
                    """
                    SELECT name FROM security_devices
                    WHERE id = %s;
                    """
                ),
                (device_id,),
            )

            device_name = cur.fetchone()[0]
            return device_name
    except psycopg2.Error as e:
        logger.error("Error retrieving device name by ID: %s", e)
        return None
    finally:
        DatabaseManager.release_connection(connection)


def get_device_business_info(device_id):
    """
    Retrieve the business name and ID associated with the given device ID.
    Returns a tuple of (business_id, business_name) or (None, None) if not found.
    """
    connection = DatabaseManager.get_connection()

    try:
        with connection.cursor() as cur:
            cur.execute(
                sql.SQL(
                    """
                    SELECT b.id, b.name FROM security_devices sd
                    JOIN businesses b ON sd.business_id = b.id
                    WHERE sd.id = %s;
                    """
                ),
                (device_id,),
            )

            result = cur.fetchone()
            if result:
                business_id, business_name = result
                return business_id, business_name
            return None, None
    except psycopg2.Error as e:
        logger.error("Error retrieving device business info by ID: %s", e)
        return None, None
    finally:
        DatabaseManager.release_connection(connection)


@device_bp.route("/api/send_alert", methods=["POST"], endpoint="send_alert_device")
@validate_auth_header(required_access_level=2)
@validate_json_payload(
    "alert_type",
)
def send_alert():
    """
    Sends an alert to the database.
    """
    alert_data = request.json

    logger.info("Alert received: %s", alert_data)

    connection = DatabaseManager.get_connection()

    try:
        with connection.cursor() as cur:
            device_id = get_device_id_by_api_key(
                request.headers["Authorization"].split(" ")[1]
            )

            cur.execute(
                sql.SQL(
                    """
                    INSERT INTO alerts(
                        device_id,
                        alert_type,
                        message) VALUES (%s, %s, %s) RETURNING id;
                    """
                ),
                (
                    device_id,
                    alert_data["alert_type"],
                    alert_data["message"] if alert_data.get("message") else None,
                ),
            )

            alert_id = cur.fetchone()[0]
            connection.commit()

            logger.info("Alert saved to database with ID: %s", alert_id)

            # Get the business name and ID associated with the device
            business_id, business_name = get_device_business_info(device_id)

            # Emit the alert to the Socket.IO server
            socket_client = SocketIOClient()
            socket_client.emit_new_alert(
                {
                    "id": alert_id,
                    "device_id": device_id,
                    "device_name": get_device_name(device_id),
                    "alert_time": datetime.now().isoformat(),
                    "alert_type": alert_data["alert_type"],
                    "business_name": business_name,
                    "business_id": business_id,
                    "message": (
                        alert_data["message"] if alert_data.get("message") else None
                    ),
                    "resolved": False,
                }
            )
            logger.info("Alert emitted to Socket.IO server.")

            return (
                jsonify({"status": "success", "message": "Alert saved to database."}),
                200,
            )
    except psycopg2.Error as e:
        logger.error("Error saving alert to database: %s", e)

        connection.rollback()
        return (
            jsonify({"status": "error", "message": "Error saving alert to database."}),
            500,
        )
    finally:
        DatabaseManager.release_connection(connection)


@device_bp.route(
    "/api/send_malfunction", methods=["POST"], endpoint="send_malfunction_device"
)
@validate_auth_header(required_access_level=2)
@validate_json_payload(
    "malfunction_type",
)
def send_malfunction():
    """
    Sends a malfunction to the database.
    """
    malfunction_data = request.json

    logger.info("Malfunction received: %s", malfunction_data)

    connection = DatabaseManager.get_connection()

    try:
        with connection.cursor() as cur:
            device_id = get_device_id_by_api_key(
                request.headers["Authorization"].split(" ")[1]
            )

            cur.execute(
                sql.SQL(
                    """
                    INSERT INTO malfunctions(
                        device_id,
                        malfunction_type,
                        message) VALUES (%s, %s, %s) RETURNING id;
                    """
                ),
                (
                    device_id,
                    malfunction_data["malfunction_type"],
                    (
                        malfunction_data["message"]
                        if malfunction_data.get("message")
                        else None
                    ),
                ),
            )

            malfunction_id = cur.fetchone()[0]
            connection.commit()

            logger.info("Malfunction saved to database with ID: %s", malfunction_id)

            # Get the business name and ID associated with the device
            business_id, business_name = get_device_business_info(device_id)

            # Emit the malfunction to the Socket.IO server
            socket_client = SocketIOClient()
            socket_client.emit_new_malfunction(
                {
                    "id": malfunction_id,
                    "device_id": device_id,
                    "device_name": get_device_name(device_id),
                    "malfunction_time": datetime.now().isoformat(),
                    "malfunction_type": malfunction_data["malfunction_type"],
                    "business_name": business_name,
                    "business_id": business_id,
                    "message": (
                        malfunction_data["message"]
                        if malfunction_data.get("message")
                        else None
                    ),
                }
            )
            logger.info("Malfunction emitted to Socket.IO server.")

            return (
                jsonify(
                    {"status": "success", "message": "Malfunction saved to database."}
                ),
                200,
            )
    except psycopg2.Error as e:
        logger.error("Error saving malfunction to database: %s", e)

        connection.rollback()
        return (
            jsonify(
                {"status": "error", "message": "Error saving malfunction to database."}
            ),
            500,
        )
    finally:
        DatabaseManager.release_connection(connection)


@device_bp.route("/api/send_log", methods=["POST"], endpoint="send_log_device")
@validate_auth_header(required_access_level=2)
@validate_json_payload(
    "log_type",
)
def send_log():
    """
    Sends a log to the database.
    """
    log_data = request.json

    logger.info("Log received: %s", log_data)

    connection = DatabaseManager.get_connection()

    try:
        with connection.cursor() as cur:
            device_id = get_device_id_by_api_key(
                request.headers["Authorization"].split(" ")[1]
            )

            cur.execute(
                sql.SQL(
                    """
                    INSERT INTO logs(
                        device_id,
                        log_type,
                        message) VALUES (%s, %s, %s) RETURNING id;
                    """
                ),
                (
                    device_id,
                    log_data["log_type"],
                    log_data["message"] if log_data.get("message") else None,
                ),
            )

            log_id = cur.fetchone()[0]
            connection.commit()

            logger.info("Log saved to database with ID: %s", log_id)

            # Get the business name and ID associated with the device
            business_id, business_name = get_device_business_info(device_id)

            # Emit the log to the Socket.IO server
            socket_client = SocketIOClient()
            socket_client.emit_new_log(
                {
                    "id": log_id,
                    "device_id": device_id,
                    "device_name": get_device_name(device_id),
                    "log_time": datetime.now().isoformat(),
                    "log_type": log_data["log_type"],
                    "business_name": business_name,
                    "business_id": business_id,
                    "message": (
                        log_data["message"] if log_data.get("message") else None
                    ),
                }
            )
            logger.info("Log emitted to Socket.IO server.")

            return (
                jsonify({"status": "success", "message": "Log saved to database."}),
                200,
            )
    except psycopg2.Error as e:
        logger.error("Error saving log to database: %s", e)

        connection.rollback()
        return (
            jsonify({"status": "error", "message": "Error saving log to database."}),
            500,
        )
    finally:
        DatabaseManager.release_connection(connection)
