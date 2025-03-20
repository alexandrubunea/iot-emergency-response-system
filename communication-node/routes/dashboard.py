"""
Handles communication between the database and the dashboard.
Provides API endpoints for retrieving business and device data.
"""

import logging
from flask import Blueprint, jsonify, request
import psycopg2

from decorators.validate_auth import validate_auth_header
from decorators.db_retry import retry_on_db_error
from utils.db import DatabaseManager

# Configure logging
logger = logging.getLogger("dashboard_blueprint")
logger.setLevel(logging.INFO)

file_handler = logging.FileHandler("blueprints.log")
file_handler.setLevel(logging.INFO)

formatter = logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")
file_handler.setFormatter(formatter)

if not logger.hasHandlers():
    logger.addHandler(file_handler)

# Create Blueprint
dashboard_bp = Blueprint("dashboard", __name__)


def fetch_business_devices(business_id: int) -> list:
    """
    Fetches all the devices utilized by a business.

    Args:
        business_id (int): The ID of the business

    Returns:
        list: Contains all the devices used by the business.
    """
    logger.info("Fetching devices for business ID: %s", business_id)

    connection = DatabaseManager.get_connection()

    try:
        with connection.cursor() as cur:
            cur.execute(
                """
                SELECT
                    id, name, motion_sensor, sound_sensor,
                    gas_sensor, fire_sensor, created_at,
                    last_active_at, status
                FROM security_devices
                WHERE business_id = %s
                ORDER BY name ASC
                """,
                (business_id,),
            )
            devices = cur.fetchall()

            result = []
            for d in devices:
                device_data = {
                    "id": d[0],
                    "name": d[1],
                    "motion_sensor": d[2],
                    "sound_sensor": d[3],
                    "gas_sensor": d[4],
                    "fire_sensor": d[5],
                }

                # Add additional fields if they exist in the database
                if len(d) > 6:
                    device_data["created_at"] = d[6].isoformat() if d[6] else None
                if len(d) > 7:
                    device_data["last_active_at"] = d[7].isoformat() if d[7] else None
                if len(d) > 8:
                    device_data["status"] = d[8]

                result.append(device_data)

            return result

    except psycopg2.Error as e:
        logger.error(
            "Database error fetching devices for business %s: %s", business_id, e
        )

        raise

    finally:
        DatabaseManager.release_connection(connection)


@dashboard_bp.route("/api/businesses", methods=["GET"])
@validate_auth_header(required_access_level=0)
@retry_on_db_error()
def fetch_all_businesses():
    """
    Fetches all the businesses from the database.

    Query Parameters:
        include_devices (bool): Whether to include device data (default: true)

    Returns:
        Response: A JSON response with the businesses and HTTP 200 code.
    """
    logger.info("Fetching all businesses")

    # Parse query parameters
    include_devices = request.args.get("include_devices", "true").lower() == "true"

    connection = DatabaseManager.get_connection()

    try:
        with connection.cursor() as cur:
            cur.execute(
                """
                SELECT id, name, lat, lon, address, created_at,
                       contact_name, contact_email, contact_phone
                FROM businesses
                ORDER BY name ASC
            """
            )
            businesses = cur.fetchall()

        result = []
        for b in businesses:
            business_data = {
                "id": b[0],
                "name": b[1],
                "lat": b[2],
                "lon": b[3],
                "address": b[4],
            }

            if len(b) > 5:
                business_data["created_at"] = b[5].isoformat() if b[5] else None
            if len(b) > 6:
                business_data["contact_name"] = b[6]
            if len(b) > 7:
                business_data["contact_email"] = b[7]
            if len(b) > 8:
                business_data["contact_phone"] = b[8]

            if include_devices:
                business_data["devices"] = fetch_business_devices(b[0])
                business_data["device_count"] = len(business_data["devices"])

            result.append(business_data)

        logger.info("Successfully fetched %s businesses", len(result))

        return jsonify({"status": "success", "data": result, "count": len(result)}), 200

    except psycopg2.Error as e:
        logger.error("Database error fetching businesses: %s", e)

        return jsonify({"status": "error", "message": "Error fetching businesses"}), 500
    finally:
        DatabaseManager.release_connection(connection)


@dashboard_bp.route("/api/businesses/<int:business_id>", methods=["GET"])
@validate_auth_header(required_access_level=0)
@retry_on_db_error()
def fetch_business(business_id):
    """
    Fetches details for a specific business.

    Args:
        business_id (int): ID of the business to fetch

    Returns:
        Response: A JSON response with the business details and HTTP 200 code.
    """
    logger.info("Fetching business ID: %s", business_id)

    connection = DatabaseManager.get_connection()

    try:
        with connection.cursor() as cur:
            cur.execute(
                """
                SELECT id, name, lat, lon, address, created_at,
                       contact_name, contact_email, contact_phone
                FROM businesses
                WHERE id = %s
            """,
                (business_id,),
            )
            business = cur.fetchone()

            if not business:
                logger.warning("Business ID %s not found", business_id)
                return (
                    jsonify(
                        {
                            "status": "error",
                            "message": f"Business with ID {business_id} not found",
                        }
                    ),
                    404,
                )

            result = {
                "id": business[0],
                "name": business[1],
                "lat": business[2],
                "lon": business[3],
                "address": business[4],
            }

            # Add additional fields if they exist in the database
            if len(business) > 5:
                result["created_at"] = business[5].isoformat() if business[5] else None
            if len(business) > 6:
                result["contact_name"] = business[6]
            if len(business) > 7:
                result["contact_email"] = business[7]
            if len(business) > 8:
                result["contact_phone"] = business[8]

            # Include devices for this business
            result["devices"] = fetch_business_devices(business_id)
            result["device_count"] = len(result["devices"])

            logger.info("Successfully fetched business ID %s", business_id)

            return jsonify({"status": "success", "data": result}), 200
    except psycopg2.Error as e:
        logger.error("Database error fetching business %s: %s", business_id, e)

        return (
            jsonify(
                {
                    "status": "error",
                    "message": f"Error fetching business with ID {business_id}",
                }
            ),
            500,
        )
    finally:
        DatabaseManager.release_connection(connection)


@dashboard_bp.route("/api/businesses/<int:business_id>/devices", methods=["GET"])
@validate_auth_header(required_access_level=0)
@retry_on_db_error()
def fetch_business_devices_route(business_id):
    """
    Fetches all devices for a specific business.

    Args:
        business_id (int): ID of the business

    Returns:
        Response: A JSON response with the devices and HTTP 200 code.
    """
    logger.info("Fetching devices for business ID: %s", business_id)

    connection = DatabaseManager.get_connection()

    try:
        # First check if the business exists
        with connection.cursor() as cur:
            cur.execute("SELECT id FROM businesses WHERE id = %s", (business_id,))
            if cur.fetchone() is None:
                logger.warning("Business ID %s not found", business_id)
                return (
                    jsonify(
                        {
                            "status": "error",
                            "message": f"Business with ID {business_id} not found",
                        }
                    ),
                    404,
                )

        # Fetch devices for this business
        devices = fetch_business_devices(business_id)

        logger.info(
            "Successfully fetched %s devices for business ID %s",
            len(devices),
            business_id,
        )

        return (
            jsonify({"status": "success", "data": devices, "count": len(devices)}),
            200,
        )
    except psycopg2.Error as e:
        logger.error(
            "Database error fetching devices for business %s: %s", business_id, e
        )

        return (
            jsonify(
                {
                    "status": "error",
                    "message": f"Error fetching devices for business with ID {business_id}",
                }
            ),
            500,
        )
    finally:
        DatabaseManager.release_connection(connection)


@dashboard_bp.route("/api/devices/<int:device_id>", methods=["GET"])
@validate_auth_header(required_access_level=0)
@retry_on_db_error()
def fetch_device(device_id):
    """
    Fetches details for a specific device.

    Args:
        device_id (int): ID of the device to fetch

    Returns:
        Response: A JSON response with the device details and HTTP 200 code.
    """
    logger.info("Fetching device ID: %s", device_id)

    connection = DatabaseManager.get_connection()

    try:
        with connection.cursor() as cur:
            cur.execute(
                """
                SELECT id, name, motion_sensor, sound_sensor, gas_sensor, fire_sensor,
                       business_id, created_at, last_active_at, status
                FROM security_devices
                WHERE id = %s
            """,
                (device_id,),
            )
            device = cur.fetchone()

            if not device:
                logger.warning("Device ID %s not found", device_id)
                return (
                    jsonify(
                        {
                            "status": "error",
                            "message": f"Device with ID {device_id} not found",
                        }
                    ),
                    404,
                )

            result = {
                "id": device[0],
                "name": device[1],
                "motion_sensor": device[2],
                "sound_sensor": device[3],
                "gas_sensor": device[4],
                "fire_sensor": device[5],
                "business_id": device[6],
            }

            if len(device) > 7:
                result["created_at"] = device[7].isoformat() if device[7] else None
            if len(device) > 8:
                result["last_active_at"] = device[8].isoformat() if device[8] else None
            if len(device) > 9:
                result["status"] = device[9]

            # Fetch business info for this device
            with connection.cursor() as cur:
                cur.execute("SELECT name FROM businesses WHERE id = %s", (device[6],))
                business = cur.fetchone()
                if business:
                    result["business_name"] = business[0]

            logger.info("Successfully fetched device ID %s", device_id)

            return jsonify({"status": "success", "data": result}), 200
    except psycopg2.Error as e:
        logger.error("Database error fetching device %s: %s", device_id, e)

        return (
            jsonify(
                {
                    "status": "error",
                    "message": f"Error fetching device with ID {device_id}",
                }
            ),
            500,
        )
    finally:
        DatabaseManager.release_connection(connection)
