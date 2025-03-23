"""
Handles communication between the database and the configurator.
Provides API endpoints for device registration and validation.
"""

import logging
from flask import Blueprint, request, jsonify
import psycopg2
from psycopg2 import sql

from decorators.validate_auth import validate_auth_header
from decorators.db_retry import retry_on_db_error
from decorators.validate_json_payload import validate_json_payload
from utils.db import DatabaseManager

# Configure logging
logger = logging.getLogger("configurator_blueprint")
logger.setLevel(logging.INFO)

file_handler = logging.FileHandler("blueprints.log")
file_handler.setLevel(logging.INFO)

formatter = logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")
file_handler.setFormatter(formatter)

if not logger.hasHandlers():
    logger.addHandler(file_handler)

# Create Blueprint
configurator_bp = Blueprint("configurator", __name__)


@configurator_bp.route("/api/register_device", methods=["POST"])
@validate_auth_header(required_access_level=1)
@validate_json_payload(
    "api_key", "device_location", "motion", "sound", "fire", "gas", "business_id"
)
@retry_on_db_error()
def register_device():
    """
    Registers a new device in the system.

    Required JSON payload:
        api_key (str): Device API key
        device_location (str): Location of the device
        motion (bool): Whether motion sensing is enabled
        sound (bool): Whether sound sensing is enabled
        fire (bool): Whether fire sensing is enabled
        gas (bool): Whether gas sensing is enabled
        business_id (int): ID of the business the device belongs to

    Returns:
        Response: A JSON response with status and message
    """
    device_config = request.json

    # Log the operation
    logger.info(
        "Registering new device for business ID: %s", device_config["business_id"]
    )

    connection = DatabaseManager.get_connection()

    try:
        # Validate business ID
        with connection.cursor() as cur:
            cur.execute(
                "SELECT id FROM businesses WHERE id = %s LIMIT 1",
                (device_config["business_id"],),
            )
            if cur.fetchone() is None:
                logger.warning("Business ID %s not found", device_config["business_id"])
                return (
                    jsonify(
                        {
                            "status": "error",
                            "message": f"Business ID {device_config['business_id']} not found",
                        }
                    ),
                    400,
                )

        # Check if API key already exists
        with connection.cursor() as cur:
            cur.execute(
                "SELECT id FROM api_keys WHERE api_key = %s LIMIT 1",
                (device_config["api_key"],),
            )
            if cur.fetchone() is not None:
                logger.warning("API key already exists")
                return (
                    jsonify({"status": "error", "message": "API key already exists"}),
                    409,
                )

        # Add the API key to the database
        api_key_id = -1
        with connection.cursor() as cur:
            cur.execute(
                "SELECT name FROM businesses WHERE id=%s LIMIT 1",
                (device_config["business_id"],),
            )
            business_name = cur.fetchone()[0]

            description = f"""
                Used by a security device named {device_config["device_location"]}
                owned by the business with {business_name}(ID: {device_config["business_id"]})
            """

            cur.execute(
                sql.SQL(
                    """
                    INSERT INTO api_keys(
                        api_key, access_level, description)
                        VALUES(%s, 2, %s) RETURNING id
                """
                ),
                (
                    device_config["api_key"],
                    description,
                ),
            )

            api_key_id = cur.fetchone()[0]
            connection.commit()

            logger.info("API Key successfully with ID: %s", api_key_id)

        # Insert new device
        with connection.cursor() as cur:
            cur.execute(
                sql.SQL(
                    """
                    INSERT INTO security_devices(
                        api_key_id, name, motion_sensor, sound_sensor,
                        fire_sensor, gas_sensor, business_id
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id
                """
                ),
                (
                    api_key_id,
                    device_config["device_location"],
                    device_config["motion"],
                    device_config["sound"],
                    device_config["fire"],
                    device_config["gas"],
                    device_config["business_id"],
                ),
            )
            device_id = cur.fetchone()[0]
            connection.commit()

            logger.info("Device registered successfully with ID: %s", device_id)
            return (
                jsonify(
                    {
                        "status": "success",
                        "message": "Device registered successfully",
                        "device_id": device_id,
                    }
                ),
                200,
            )
    except psycopg2.Error as e:
        logger.error("Database error during device registration: %s", e)

        connection.rollback()
        return (
            jsonify(
                {
                    "status": "error",
                    "message": "Database error during device registration",
                }
            ),
            500,
        )
    finally:
        DatabaseManager.release_connection(connection)


@configurator_bp.route("/api/validate_employee_auth_token", methods=["GET"])
@validate_auth_header(required_access_level=1)
def validate_employee_auth_token():
    """
    Validates an employee authentication token.

    Returns:
        Response: A JSON response with status and message
    """
    logger.info("Employee auth token validated successfully")
    return (
        jsonify({"status": "success", "message": "Authentication token is valid"}),
        200,
    )


@configurator_bp.route("/api/business_exists/<int:business_id>", methods=["GET"])
@validate_auth_header(required_access_level=1)
@retry_on_db_error()
def business_exists(business_id):
    """
    Checks if a business exists in the system.

    Args:
        business_id (int): The unique identifier of the business.

    Returns:
        Response: A JSON response with status and message
    """
    logger.info("Checking if business ID %s exists", business_id)

    connection = DatabaseManager.get_connection()

    try:
        with connection.cursor() as cur:
            cur.execute(
                "SELECT id FROM businesses WHERE id = %s LIMIT 1", (business_id,)
            )
            result = cur.fetchone()

            if result is not None:
                logger.info("Business ID %s exists", business_id)
                return (
                    jsonify(
                        {
                            "status": "success",
                            "message": f"Business ID {business_id} exists",
                        }
                    ),
                    200,
                )

            logger.warning("Business ID %s not found", business_id)
            return (
                jsonify(
                    {
                        "status": "error",
                        "message": f"Business ID {business_id} not found",
                    }
                ),
                404,
            )
    except psycopg2.Error as e:
        logger.error("Database error checking business existence: %s", e)

        return (
            jsonify(
                {
                    "status": "error",
                    "message": "Database error while checking business existence",
                }
            ),
            500,
        )
    finally:
        DatabaseManager.release_connection(connection)
