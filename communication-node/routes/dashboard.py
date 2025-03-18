"""
Handles communication between the database and the dashboard.
"""

from flask import Blueprint, jsonify, request
import psycopg2
from utils.api_key import check_api_key
from utils.db import connection

dashboard_bp = Blueprint("dashboard", __name__)


def fetch_business_devices(business_id: int) -> list:
    """
    Fetches all the devices utilized by a business.

    Returns:
        Array: Contains all the devices used by the business.
    """
    try:
        with connection.cursor() as cur:
            cur.execute(
                "SELECT id,name,motion_sensor,sound_sensor,gas_sensor,fire_sensor FROM "
                "security_devices WHERE business_id=%s",
                (business_id,),
            )

            devices = cur.fetchall()
    except psycopg2.Error as e:
        print(f"Database error: {e}")
        return False

    result = [
        {
            "id": d[0],
            "name": d[1],
            "motion_sensor": d[2],
            "sound_sensor": d[3],
            "gas_sensor": d[4],
            "fire_sensor": d[5],
        }
        for d in devices
    ]

    return result


@dashboard_bp.route("/api/fetchAllBusinesses", methods=["GET"])
def fetch_all_businesses():
    """
    Fetches all the businesses from the database.

    Returns:
        Response: A JSON response with the businesses and HTTP 200 code.
    """

    auth_header = request.headers.get("Authorization")

    if not auth_header or " " not in auth_header:
        return jsonify({"message": "Invalid Authorization header"}), 400

    api_key = auth_header.split(" ")[1]
    if not check_api_key(api_key):
        return jsonify({"message": "API KEY is not valid."}), 401

    try:
        with connection.cursor() as cur:
            cur.execute("SELECT * FROM businesses")

            businesses = cur.fetchall()
    except psycopg2.Error as e:
        print(f"Database error: {e}")
        return False

    result = [
        {
            "id": b[0],
            "name": b[1],
            "lat": b[2],
            "lon": b[3],
            "address": b[4],
            "devices": fetch_business_devices(b[0]),
        }
        for b in businesses
    ]

    return jsonify(result), 200
