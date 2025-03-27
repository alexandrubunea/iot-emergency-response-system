"""
Handles the communication between the database and the device endpoints.
"""

import logging
from flask import Blueprint, jsonify, request
import psycopg2
from psycopg2 import sql

from decorators.validate_auth import validate_auth_header
from decorators.validate_json_payload import validate_json_payload
from utils.db import DatabaseManager

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
            cur.execute(
                sql.SQL(
                    """
                    INSERT INTO alerts(
                        device_id,
                        alert_type) VALUES (%s, %s) RETURNING id;
                    """
                ),
                (
                    get_device_id_by_api_key(
                        request.headers["Authorization"].split(" ")[1]
                    ),
                    alert_data["alert_type"],
                ),
            )

            alert_id = cur.fetchone()[0]
            connection.commit()

            logger.info("Alert saved to database with ID: %s", alert_id)
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
            cur.execute(
                sql.SQL(
                    """
                    INSERT INTO malfunctions(
                        device_id,
                        malfunction_type) VALUES (%s, %s) RETURNING id;
                    """
                ),
                (
                    get_device_id_by_api_key(
                        request.headers["Authorization"].split(" ")[1]
                    ),
                    malfunction_data["malfunction_type"],
                ),
            )

            malfunction_id = cur.fetchone()[0]
            connection.commit()

            logger.info("Malfunction saved to database with ID: %s", malfunction_id)
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
            cur.execute(
                sql.SQL(
                    """
                    INSERT INTO device_logs(
                        device_id,
                        log_type) VALUES (%s, %s) RETURNING id;
                    """
                ),
                (
                    get_device_id_by_api_key(
                        request.headers["Authorization"].split(" ")[1]
                    ),
                    log_data["log_type"],
                ),
            )

            log_id = cur.fetchone()[0]
            connection.commit()

            logger.info("Log saved to database with ID: %s", log_id)
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
