"""
Handles communication between the database and the dashboard.
Provides API endpoints for retrieving business and device data.
"""

import hashlib
import logging
import uuid
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

# Sensor Status
SENSOR_NOT_USED = -1
SENSOR_HEALTHY = 1
SENSOR_MALFUNCTION = 2


def check_sensor_malfunction(device_id: int, sensor_type: str) -> int:
    """
    Checks if a specific sensor type of a device has reported a malfunction.

    Args:
        device_id (int): The ID of the device.
        sensor_type (str): The type of sensor to check for malfunctions.

    Returns:
        bool: True if the sensor has reported a malfunction, False otherwise.
    """
    connection = DatabaseManager.get_connection()

    try:
        with connection.cursor() as cur:
            cur.execute(
                sql.SQL(
                    """
                    SELECT EXISTS (
                        SELECT 1
                        FROM malfunctions
                        WHERE device_id = %s AND malfunction_type = %s AND resolved = FALSE
                    )
                    """
                ),
                (device_id, sensor_type),
            )
            return SENSOR_MALFUNCTION if cur.fetchone()[0] else SENSOR_HEALTHY

    except psycopg2.Error as e:
        logger.error("Database error checking sensor malfunction: %s", e)
        raise

    finally:
        DatabaseManager.release_connection(connection)


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
                    "motion_sensor": (
                        check_sensor_malfunction(d[0], "motion_sensor")
                        if d[2]
                        else SENSOR_NOT_USED
                    ),
                    "sound_sensor": (
                        check_sensor_malfunction(d[0], "sound_sensor")
                        if d[3]
                        else SENSOR_NOT_USED
                    ),
                    "gas_sensor": (
                        check_sensor_malfunction(d[0], "gas_sensor")
                        if d[4]
                        else SENSOR_NOT_USED
                    ),
                    "fire_sensor": (
                        check_sensor_malfunction(d[0], "fire_sensor")
                        if d[5]
                        else SENSOR_NOT_USED
                    ),
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
                SELECT b.id, b.name, b.lat, b.lon, b.address, b.created_at,
                       b.contact_name, b.contact_email, b.contact_phone,
                       EXISTS (
                           SELECT 1
                           FROM security_devices sd
                           JOIN alerts a ON sd.id = a.device_id
                           WHERE sd.business_id = b.id AND a.resolved = FALSE
                       ) AS alert
                FROM businesses b
                ORDER BY b.name ASC
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
                "alert": b[9],
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


@dashboard_bp.route("/api/employees", methods=["POST"])
@validate_auth_header(required_access_level=0)
@validate_json_payload(
    "first_name",
    "last_name",
)
def add_employee():
    """
    Adds a new employee to the database.

    Return:
        Response: A JSON response with the status of the operation.
    """

    logger.info("New employee added to the database.")

    connection = DatabaseManager.get_connection()

    api_key = hashlib.sha256(str(uuid.uuid4()).encode()).hexdigest()[:64]

    try:
        with connection.cursor() as cur:
            cur.execute(
                """
                INSERT INTO api_keys(api_key, access_level, description)
                VALUES(%s, 1, %s) RETURNING id
                """,
                (
                    api_key,
                    f"""API Key used by employee {request.json['first_name']}
                    {request.json['last_name']}""",
                ),
            )
            api_key_id = cur.fetchone()[0]
            connection.commit()

            cur.execute(
                sql.SQL(
                    """
                        INSERT INTO employees(
                            first_name, last_name, email, phone, api_key_id
                        ) VALUES(%s, %s, %s, %s, %s) RETURNING id
                        """
                ),
                (
                    request.json["first_name"],
                    request.json["last_name"],
                    request.json["email"],
                    request.json["phone"],
                    api_key_id,
                ),
            )

            employee_id = cur.fetchone()[0]
            connection.commit()

            logger.info("Employee registered successfully with ID: %s", employee_id)
            return (
                jsonify(
                    {
                        "status": "success",
                        "message": "Employee registered successfully",
                    }
                ),
                200,
            )
    except psycopg2.Error as e:
        logger.error("Database error during employee registration: %s", e)

        connection.rollback()
        return (
            jsonify(
                {
                    "status": "error",
                    "message": "Database error during employee registration",
                }
            ),
            500,
        )
    finally:
        DatabaseManager.release_connection(connection)


@dashboard_bp.route("/api/employees/<int:employee_id>", methods=["DELETE"])
@validate_auth_header(required_access_level=0)
def delete_employee(employee_id: int):
    """
    Deletes an employee from the database.

    Args:
        employee_id (int): The ID of the employee to delete.

    Returns:
        Response: A JSON response with the status of the operation.
    """
    logger.info("Deleting employee with ID: %s", employee_id)

    connection = DatabaseManager.get_connection()

    try:
        with connection.cursor() as cur:
            cur.execute(
                sql.SQL("DELETE FROM employees WHERE id = %s"),
                (employee_id,),
            )

            connection.commit()

            logger.info("Employee deleted successfully")
            return jsonify({"status": "success", "message": "Employee deleted"}), 200

    except psycopg2.Error as e:
        logger.error("Database error deleting employee: %s", e)

        connection.rollback()
        return (
            jsonify({"status": "error", "message": "Error deleting employee"}),
            500,
        )
    finally:
        DatabaseManager.release_connection(connection)


@dashboard_bp.route("/api/employees", methods=["GET"])
@validate_auth_header(required_access_level=0)
@retry_on_db_error()
def fetch_all_employees():
    """
    Fetches all the employees from the database.

    Returns:
        Response: A JSON response with the employees and HTTP 200 code.
    """
    logger.info("Fetching all employees")

    connection = DatabaseManager.get_connection()

    try:
        with connection.cursor() as cur:
            cur.execute(
                """
                SELECT e.id, e.first_name, e.last_name, a.api_key, e.email, e.phone, e.created_at
                FROM employees e
                JOIN api_keys a ON e.api_key_id = a.id
                ORDER BY e.first_name ASC
                """
            )
            employees = cur.fetchall()

        result = []
        for e in employees:
            employee_data = {
                "id": e[0],
                "first_name": e[1],
                "last_name": e[2],
                "api_key": e[3][:8] + "..." + e[3][-8:],
                "email": e[4],
                "phone": e[5],
            }

            if len(e) > 3:
                employee_data["created_at"] = e[6].isoformat() if e[6] else None

            result.append(employee_data)

        logger.info("Successfully fetched %s employees", len(result))

        return jsonify({"status": "success", "data": result, "count": len(result)}), 200

    except psycopg2.Error as e:
        logger.error("Database error fetching employees: %s", e)

        return jsonify({"status": "error", "message": "Error fetching employees"}), 500
    finally:
        DatabaseManager.release_connection(connection)


@dashboard_bp.route("/api/alerts", methods=["GET"])
@validate_auth_header(required_access_level=0)
@retry_on_db_error()
def fetch_all_alerts():
    """
    Fetches all the alerts from the database.

    Returns:
        Response: A JSON response with the alerts and HTTP 200 code.
    """
    logger.info("Fetching all alerts")

    connection = DatabaseManager.get_connection()

    try:
        with connection.cursor() as cur:
            cur.execute(
                """
                SELECT
                    a.id,
                    a.device_id,
                    a.alert_type,
                    a.alert_time,
                    a.message,
                    a.resolved,
                    sd.name AS device_name,
                    b.name AS business_name,
                    b.id AS business_id
                FROM
                    alerts a
                JOIN
                    security_devices sd ON a.device_id = sd.id
                JOIN
                    businesses b ON sd.business_id = b.id
                WHERE
                    a.resolved = FALSE
                ORDER BY
                    a.alert_time DESC
                """
            )
            alerts = cur.fetchall()

        result = []
        for a in alerts:
            alert_data = {
                "id": a[0],
                "device_id": a[1],
                "alert_type": a[2],
                "alert_time": a[3].isoformat() if a[3] else None,
                "message": a[4],
                "resolved": a[5],
                "device_name": a[6],
                "business_name": a[7],
                "business_id": a[8],
            }

            result.append(alert_data)

        logger.info("Successfully fetched %s alerts", len(result))

        return jsonify({"status": "success", "data": result, "count": len(result)}), 200

    except psycopg2.Error as e:
        logger.error("Database error fetching alerts: %s", e)

        return jsonify({"status": "error", "message": "Error fetching alerts"}), 500
    finally:
        DatabaseManager.release_connection(connection)


@dashboard_bp.route("/api/malfunctions", methods=["GET"])
@validate_auth_header(required_access_level=0)
@retry_on_db_error()
def fetch_all_malfunctions():
    """
    Fetches all the malfunctions from the database.

    Returns:
        Response: A JSON response with the malfunctions and HTTP 200 code.
    """
    logger.info("Fetching all malfunctions")

    connection = DatabaseManager.get_connection()

    try:
        with connection.cursor() as cur:
            cur.execute(
                """
                SELECT
                    m.id,
                    m.device_id,
                    m.malfunction_type,
                    m.malfunction_time,
                    m.message,
                    m.resolved,
                    sd.name AS device_name,
                    b.name AS business_name,
                    b.id AS business_id
                FROM
                    malfunctions m
                JOIN
                    security_devices sd ON m.device_id = sd.id
                JOIN
                    businesses b ON sd.business_id = b.id
                WHERE
                    m.resolved = FALSE
                ORDER BY
                    m.malfunction_time DESC
                """
            )
            malfunctions = cur.fetchall()

        result = []
        for m in malfunctions:
            malfunction_data = {
                "id": m[0],
                "device_id": m[1],
                "malfunction_type": m[2],
                "malfunction_time": m[3].isoformat() if m[3] else None,
                "message": m[4],
                "resolved": m[5],
                "device_name": m[6],
                "business_name": m[7],
                "business_id": m[8],
            }

            result.append(malfunction_data)

        logger.info("Successfully fetched %s malfunctions", len(result))

        return jsonify({"status": "success", "data": result, "count": len(result)}), 200

    except psycopg2.Error as e:
        logger.error("Database error fetching malfunctions: %s", e)

        return (
            jsonify({"status": "error", "message": "Error fetching malfunctions"}),
            500,
        )
    finally:
        DatabaseManager.release_connection(connection)


@dashboard_bp.route("/api/devices_logs", methods=["GET"])
@validate_auth_header(required_access_level=0)
@retry_on_db_error()
def fetch_all_device_logs():
    """
    Fetches all the device logs from the database.

    Returns:
        Response: A JSON response with the device logs and HTTP 200 code.
    """
    logger.info("Fetching all device logs")

    connection = DatabaseManager.get_connection()

    try:
        with connection.cursor() as cur:
            cur.execute(
                """
                SELECT
                    dl.id,
                    dl.device_id,
                    dl.log_time,
                    dl.log_type,
                    dl.message,
                    sd.name AS device_name,
                    b.name AS business_name,
                    b.id AS business_id
                FROM
                    device_logs dl
                JOIN
                    security_devices sd ON dl.device_id = sd.id
                JOIN
                    businesses b ON sd.business_id = b.id
                ORDER BY
                    dl.log_time DESC
                """
            )
            device_logs = cur.fetchall()

        result = []
        for dl in device_logs:
            device_log_data = {
                "id": dl[0],
                "device_id": dl[1],
                "log_time": dl[2].isoformat() if dl[2] else None,
                "log_type": dl[3],
                "message": dl[4],
                "device_name": dl[5],
                "business_name": dl[6],
                "business_id": dl[7],
            }

            result.append(device_log_data)

        logger.info("Successfully fetched %s device logs", len(result))

        return jsonify({"status": "success", "data": result, "count": len(result)}), 200

    except psycopg2.Error as e:
        logger.error("Database error fetching device logs: %s", e)

        return (
            jsonify({"status": "error", "message": "Error fetching device logs"}),
            500,
        )
    finally:
        DatabaseManager.release_connection(connection)


@dashboard_bp.route("/api/solve_alert/<int:alert_id>", methods=["POST"])
@validate_auth_header(required_access_level=0)
def solve_alert(alert_id: int):
    """
    Marks an alert as resolved in the database.

    Args:
        alert_id (int): The ID of the alert to mark as resolved.

    Returns:
        Response: A JSON response with the status of the operation.
    """
    logger.info("Solving alert with ID: %s", alert_id)

    connection = DatabaseManager.get_connection()

    try:
        with connection.cursor() as cur:
            cur.execute(
                sql.SQL("UPDATE alerts SET resolved = TRUE WHERE id = %s"),
                (alert_id,),
            )

            connection.commit()

            logger.info("Alert solved successfully")
            return jsonify({"status": "success", "message": "Alert solved"}), 200

    except psycopg2.Error as e:
        logger.error("Database error solving alert: %s", e)

        connection.rollback()
        return (
            jsonify({"status": "error", "message": "Error solving alert"}),
            500,
        )
    finally:
        DatabaseManager.release_connection(connection)


@dashboard_bp.route("/api/solve_malfunction/<int:malfunction_id>", methods=["POST"])
@validate_auth_header(required_access_level=0)
def solve_malfunction(malfunction_id: int):
    """
    Marks a malfunction as resolved in the database.

    Args:
        malfunction_id (int): The ID of the malfunction to mark as resolved.

    Returns:
        Response: A JSON response with the status of the operation.
    """
    logger.info("Solving malfunction with ID: %s", malfunction_id)

    connection = DatabaseManager.get_connection()

    try:
        with connection.cursor() as cur:
            cur.execute(
                sql.SQL("UPDATE malfunctions SET resolved = TRUE WHERE id = %s"),
                (malfunction_id,),
            )

            connection.commit()

            logger.info("Malfunction solved successfully")
            return jsonify({"status": "success", "message": "Malfunction solved"}), 200

    except psycopg2.Error as e:
        logger.error("Database error solving malfunction: %s", e)

        connection.rollback()
        return (
            jsonify({"status": "error", "message": "Error solving malfunction"}),
            500,
        )
    finally:
        DatabaseManager.release_connection(connection)


@dashboard_bp.route("/api/solve_business_alerts/<int:business_id>", methods=["POST"])
@validate_auth_header(required_access_level=0)
def solve_business_alerts(business_id: int):
    """
    Marks all unresolved alerts for a business as resolved in the database.

    Args:
        business_id (int): The ID of the business to mark alerts as resolved.

    Returns:
        Response: A JSON response with the status of the operation.
    """
    logger.info("Solving all alerts for business with ID: %s", business_id)

    connection = DatabaseManager.get_connection()

    try:
        with connection.cursor() as cur:
            cur.execute(
                sql.SQL(
                    "UPDATE alerts SET resolved = TRUE WHERE device_id "
                    "IN (SELECT id FROM security_devices "
                    "WHERE business_id = %s)"
                ),
                (business_id,),
            )

            connection.commit()

            logger.info("Alerts solved successfully")
            return jsonify({"status": "success", "message": "Alerts solved"}), 200

    except psycopg2.Error as e:
        logger.error("Database error solving alerts: %s", e)

        connection.rollback()
        return (
            jsonify({"status": "error", "message": "Error solving alerts"}),
            500,
        )
    finally:
        DatabaseManager.release_connection(connection)


@dashboard_bp.route(
    "/api/solve_business_malfunctions/<int:business_id>", methods=["POST"]
)
@validate_auth_header(required_access_level=0)
def solve_business_malfunctions(business_id: int):
    """
    Marks all unresolved malfunctions for a business as resolved in the database.

    Args:
        business_id (int): The ID of the business to mark malfunctions as resolved.

    Returns:
        Response: A JSON response with the status of the operation.
    """
    logger.info("Solving all malfunctions for business with ID: %s", business_id)

    connection = DatabaseManager.get_connection()

    try:
        with connection.cursor() as cur:
            cur.execute(
                sql.SQL(
                    "UPDATE malfunctions SET resolved = TRUE"
                    " WHERE device_id IN (SELECT id FROM security_devices"
                    " WHERE business_id = %s)"
                ),
                (business_id,),
            )

            connection.commit()

            logger.info("Malfunctions solved successfully")
            return jsonify({"status": "success", "message": "Malfunctions solved"}), 200

    except psycopg2.Error as e:
        logger.error("Database error solving malfunctions: %s", e)

        connection.rollback()
        return (
            jsonify({"status": "error", "message": "Error solving malfunctions"}),
            500,
        )
    finally:
        DatabaseManager.release_connection(connection)


@dashboard_bp.route("/api/stats", methods=["GET"])
@validate_auth_header(required_access_level=0)
def get_dashboard_stats():
    """
    Retrieves various statistics for the dashboard display.

    Fetches counts for total clients (businesses), active devices,
    recent unresolved alerts (past 7 days), unresolved motion alerts,
    unresolved fire alerts, and recent unresolved device malfunctions (past 30 days).

    Returns:
        Response: A JSON response containing the dashboard statistics or an error message.
    """
    logger.info("Attempting to fetch dashboard statistics.")

    connection = None
    stats = {}

    try:
        connection = DatabaseManager.get_connection()

        with connection.cursor() as cur:
            query = sql.SQL(
                """
                SELECT
                    (SELECT COUNT(*) FROM businesses) AS total_clients,
                    (SELECT COUNT(*) FROM security_devices) AS active_devices,
                    (SELECT COUNT(*) FROM alerts
                     WHERE alert_time >= NOW() - INTERVAL '7 days') AS recent_alerts,
                    (SELECT COUNT(*) FROM alerts
                     WHERE alert_type = {motion_type}) AS total_intrusions,
                    (SELECT COUNT(*) FROM alerts
                     WHERE alert_type = {fire_type}) AS total_fires,
                    (SELECT COUNT(*) FROM malfunctions
                     WHERE malfunction_time >= NOW() - INTERVAL '30 days') AS recent_malfunctions;
            """
            ).format(
                motion_type=sql.Literal("motion_alert"),
                fire_type=sql.Literal("fire_alert"),
            )

            cur.execute(query)
            result = cur.fetchone()

            if result:
                stats = {
                    "clients": result[0],
                    "activeDevices": result[1],
                    "alerts": result[2],
                    "detectedIntruders": result[3],
                    "detectedFires": result[4],
                    "deviceMalfunctions": result[5],
                }
                logger.info("Successfully fetched dashboard statistics: %s", stats)
                return jsonify({"status": "success", "data": stats}), 200

            logger.warning("Dashboard statistics query returned no results.")
            return (
                jsonify(
                    {"status": "error", "message": "Could not retrieve statistics"}
                ),
                500,
            )

    except (psycopg2.Error, ConnectionError) as e:
        logger.error(
            "Database error fetching dashboard statistics: %s", e, exc_info=True
        )
        if connection:
            try:
                connection.rollback()
            except psycopg2.Error as rb_e:
                logger.error("Error during rollback: %s", rb_e)
        return (
            jsonify(
                {"status": "error", "message": "Error fetching dashboard statistics"}
            ),
            500,
        )
    except Exception as e:
        logger.error(
            "An unexpected error occurred fetching stats: %s", e, exc_info=True
        )
        return (
            jsonify(
                {"status": "error", "message": "An internal server error occurred"}
            ),
            500,
        )
    finally:
        DatabaseManager.release_connection(connection)


@dashboard_bp.route("/api/alerts_over_time", methods=["GET"])
@validate_auth_header(required_access_level=0)
@validate_json_payload("range")
def get_graph_alert_data():
    """
    Provides aggregated alert data (motion and fire) over a specified time range
    suitable for plotting on a graph.

    Query Parameters:
        range (str): The time range for the data. Accepted values:
                     '24h', '1w', '1m', '6m', '1y'. Default: '1m'.

    Returns:
        Response: A JSON response containing labels and datasets for the graph,
                  or an error message.
    """
    time_range = request.json.get("range")
    logger.info("Fetching alert data for graph. Range: %s", time_range)

    interval_sql = None
    start_time_sql = None
    label_format_sql = None
    end_time_sql = "NOW()"

    time_range_config = {
        "24h": {
            "interval_sql": "INTERVAL '1 hour'",
            "start_time_sql": "NOW() - INTERVAL '24 hours'",
            "label_format_sql": "YYYY-MM-DD HH24:00",
        },
        "1w": {
            "interval_sql": "INTERVAL '1 day'",
            "start_time_sql": "NOW() - INTERVAL '7 days'",
            "label_format_sql": "YYYY-MM-DD",
        },
        "1m": {
            "interval_sql": "INTERVAL '1 day'",
            "start_time_sql": "NOW() - INTERVAL '1 month'",
            "label_format_sql": "YYYY-MM-DD",
        },
        "6m": {
            "interval_sql": "INTERVAL '1 week'",
            "start_time_sql": "NOW() - INTERVAL '6 months'",
            "label_format_sql": "YYYY-MM-DD",
        },
        "1y": {
            "interval_sql": "INTERVAL '1 month'",
            "start_time_sql": "NOW() - INTERVAL '1 year'",
            "label_format_sql": "YYYY-MM",
        },
    }

    if time_range in time_range_config:
        config = time_range_config[time_range]
        interval_sql = config["interval_sql"]
        start_time_sql = config["start_time_sql"]
        label_format_sql = config["label_format_sql"]
    else:
        logger.warning("Invalid time range specified: %s", time_range)
        return (
            jsonify(
                {
                    "status": "error",
                    "message": "Invalid time range. Use '24h', '1w', '1m', '6m', or '1y'.",
                }
            ),
            400,
        )

    connection = None
    graph_data = {
        "labels": [],
        "datasets": [
            {"label": "Detected Fires", "data": []},
            {"label": "Detected Intruders", "data": []},
        ],
    }

    try:
        connection = DatabaseManager.get_connection()

        with connection.cursor() as cur:
            trunc_interval = (
                "hour"
                if time_range == "24h"
                else (
                    "day"
                    if time_range in ["1w", "1m"]
                    else "week" if time_range == "6m" else "month"
                )
            )

            final_query = sql.SQL(
                """
                WITH time_series AS (
                    SELECT generate_series(
                        date_trunc({interval_name}, {start_time}),
                        {end_time},
                        {interval_step}
                    )::timestamp AS time_bucket
                )
                SELECT
                    to_char(ts.time_bucket, {label_format}) AS label,
                    COALESCE(SUM(CASE WHEN a.alert_type = {fire_type}
                    THEN 1 ELSE 0 END), 0) AS fire_count,
                    COALESCE(SUM(CASE WHEN a.alert_type = {motion_type}
                    THEN 1 ELSE 0 END), 0) AS motion_count
                FROM time_series ts
                LEFT JOIN alerts a ON
                date_trunc({interval_name}, a.alert_time) = ts.time_bucket
                    AND a.alert_type IN ({fire_type}, {motion_type})
                    AND a.alert_time >= {start_time}
                WHERE ts.time_bucket >= date_trunc({interval_name}, {start_time})
                  AND ts.time_bucket <= {end_time}
                GROUP BY ts.time_bucket
                ORDER BY ts.time_bucket;
            """
            ).format(
                interval_name=sql.Literal(trunc_interval),
                interval_step=sql.SQL(interval_sql),
                start_time=sql.SQL(start_time_sql),
                end_time=sql.SQL(end_time_sql),
                label_format=sql.Literal(label_format_sql),
                fire_type=sql.Literal("fire_alert"),
                motion_type=sql.Literal("motion_alert"),
            )

            logger.debug("Executing graph query: %s", final_query.as_string(cur))
            cur.execute(final_query)
            results = cur.fetchall()

            for row in results:
                graph_data["labels"].append(row[0])
                graph_data["datasets"][0]["data"].append(row[1])
                graph_data["datasets"][1]["data"].append(row[2])

            logger.info("Successfully fetched %d data points for graph.", len(results))
            return jsonify({"status": "success", "data": graph_data}), 200

    except (psycopg2.Error, ConnectionError) as e:
        logger.error("Database error fetching graph data: %s", e, exc_info=True)
        if connection:
            try:
                connection.rollback()
            except psycopg2.Error as rb_e:
                logger.error("Error during rollback: %s", rb_e)
        return (
            jsonify({"status": "error", "message": "Error fetching graph data"}),
            500,
        )
    except Exception as e:
        logger.error(
            "An unexpected error occurred fetching graph data: %s", e, exc_info=True
        )
        return (
            jsonify(
                {"status": "error", "message": "An internal server error occurred"}
            ),
            500,
        )
    finally:
        DatabaseManager.release_connection(connection)
