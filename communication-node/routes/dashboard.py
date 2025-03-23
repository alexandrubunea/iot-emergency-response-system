"""
Handles communication between the database and the dashboard.
Provides API endpoints for retrieving business and device data.
"""

import logging
from flask import Blueprint, jsonify, request
import psycopg2
from psycopg2 import sql

from decorators.validate_auth import validate_auth_header
from decorators.db_retry import retry_on_db_error
from decorators.validate_json_payload import validate_json_payload
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
                    "motion_sensor": 1 if d[2] else -1,
                    "sound_sensor": 1 if d[3] else -1,
                    "gas_sensor": 1 if d[4] else -1,
                    "fire_sensor": 1 if d[5] else -1,
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


@dashboard_bp.route("/api/businesses", methods=["POST"])
@validate_auth_header(required_access_level=0)
@validate_json_payload(
    "name",
    "latitude",
    "longitude",
    "address",
    "contactName",
    "contactEmail",
    "contactPhone",
)
def add_business():
    """
    Adds a new business to the database.

    Return:
        Response: A JSON response with the status of the operation.
    """
    business_data = request.json

    logger.info("New business added to the database.")

    connection = DatabaseManager.get_connection()

    try:
        with connection.cursor() as cur:
            cur.execute(
                sql.SQL(
                    """
                        INSERT INTO businesses(
                            name, lat, lon, address, contact_name, contact_email, contact_phone
                        ) VALUES(%s, %s, %s, %s, %s, %s, %s) RETURNING id
                        """
                ),
                (
                    business_data["name"],
                    business_data["latitude"],
                    business_data["longitude"],
                    business_data["address"],
                    business_data.get("contactName", ""),
                    business_data.get("contactEmail", ""),
                    business_data.get("contactPhone", ""),
                ),
            )

            business_id = cur.fetchone()[0]
            connection.commit()

            logger.info("Business registered successfully with ID: %s", business_id)
            return (
                jsonify(
                    {
                        "status": "success",
                        "message": "Business registered successfully",
                    }
                ),
                200,
            )
    except psycopg2.Error as e:
        logger.error("Database error during business registration: %s", e)

        connection.rollback()
        return (
            jsonify(
                {
                    "status": "error",
                    "message": "Database error during business registration",
                }
            ),
            500,
        )
    finally:
        DatabaseManager.release_connection(connection)


@dashboard_bp.route("/api/businesses/<int:business_id>", methods=["DELETE"])
@validate_auth_header(required_access_level=0)
def delete_business(business_id: int):
    """
    Deletes a business from the database.

    Args:
        business_id (int): The ID of the business to delete.

    Returns:
        Response: A JSON response with the status of the operation.
    """
    logger.info("Deleting business with ID: %s", business_id)

    connection = DatabaseManager.get_connection()

    try:
        with connection.cursor() as cur:
            cur.execute(
                sql.SQL("DELETE FROM businesses WHERE id = %s"),
                (business_id,),
            )

            connection.commit()

            logger.info("Business deleted successfully")
            return jsonify({"status": "success", "message": "Business deleted"}), 200

    except psycopg2.Error as e:
        logger.error("Database error deleting business: %s", e)

        connection.rollback()
        return (
            jsonify({"status": "error", "message": "Error deleting business"}),
            500,
        )
    finally:
        DatabaseManager.release_connection(connection)


@dashboard_bp.route("/api/devices/<int:device_id>", methods=["DELETE"])
@validate_auth_header(required_access_level=0)
def delete_device(device_id: int):
    """
    Deletes a device from the database.

    Args:
        device_id (int): The ID of the device to delete.

    Returns:
        Response: A JSON response with the status of the operation.
    """
    logger.info("Deleting device with ID: %s", device_id)

    connection = DatabaseManager.get_connection()

    try:
        with connection.cursor() as cur:
            cur.execute(
                sql.SQL("DELETE FROM security_devices WHERE id = %s"),
                (device_id,),
            )

            connection.commit()

            logger.info("Device deleted successfully")
            return jsonify({"status": "success", "message": "Device deleted"}), 200

    except psycopg2.Error as e:
        logger.error("Database error deleting device: %s", e)

        connection.rollback()
        return (
            jsonify({"status": "error", "message": "Error deleting device"}),
            500,
        )
    finally:
        DatabaseManager.release_connection(connection)
