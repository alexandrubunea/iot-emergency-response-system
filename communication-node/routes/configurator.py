"""
Handles communication between the database and the configurator.
"""

from flask import Blueprint, Response

configurator_bp = Blueprint("configurator", __name__)


@configurator_bp.route("/api/register_device", methods=["POST"])
def register_device():
    """
    Registers a new device in the system.

    Returns:
        Response: A JSON response with a success status and HTTP 200 code.
    """
    return Response('{"status":"success"}', status=200, mimetype="application/json")


@configurator_bp.route("/api/validate_employee_auth_token", methods=["POST"])
def validate_employee_auth_token():
    """
    Validates an employee authentication token.

    Returns:
        Response: A JSON response with a success status and HTTP 200 code.
    """
    return Response('{"status":"success"}', status=200, mimetype="application/json")


@configurator_bp.route("/api/business_exists/<business_id>", methods=["GET"])
def business_exists(business_id):
    """
    Checks if a business exists in the system.

    Args:
        business_id (str): The unique identifier of the business.

    Returns:
        Response: A JSON response with a success status and HTTP 200 code.
    """
    print(business_id)
    return Response('{"status":"success"}', status=200, mimetype="application/json")


@configurator_bp.route("/api/validate_device_registration", methods=["POST"])
def validate_device_registration():
    """
    Validates whether a device has been successfully registered.

    Returns:
        Response: A JSON response with a success status and HTTP 200 code.
    """
    return Response('{"status":"success"}', status=200, mimetype="application/json")
