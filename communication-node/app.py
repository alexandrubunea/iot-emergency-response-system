"""
Flask application for handling API requests in the communication node.
"""

from flask import Flask, Response

app = Flask(__name__)


@app.route("/api/register_device", methods=["POST"])
def register_device():
    """
    Registers a new device in the system.

    Returns:
        Response: A JSON response with a success status and HTTP 200 code.
    """
    return Response('{"status":"success"}', status=200, mimetype="application/json")


@app.route("/api/validate_employee_auth_token", methods=["POST"])
def validate_employee_auth_token():
    """
    Validates an employee authentication token.

    Returns:
        Response: A JSON response with a success status and HTTP 200 code.
    """
    return Response('{"status":"success"}', status=200, mimetype="application/json")


@app.route("/api/business_exists/<business_id>", methods=["GET"])
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


@app.route("/api/validate_device_registration", methods=["POST"])
def validate_device_registration():
    """
    Validates whether a device has been successfully registered.

    Returns:
        Response: A JSON response with a success status and HTTP 200 code.
    """
    return Response('{"status":"success"}', status=200, mimetype="application/json")


if __name__ == "__main__":
    app.run()
