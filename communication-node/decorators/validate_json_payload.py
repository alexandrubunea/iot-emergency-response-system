"""
Validate JSON Payload decorator for validating JSON payloads.
Check if all the required fields exist in the JSON payload.
"""

import logging
from functools import wraps
from flask import request, jsonify

# Configure logging
logger = logging.getLogger("validate_json_decorator")
logger.setLevel(logging.INFO)

file_handler = logging.FileHandler("utils.log")
file_handler.setLevel(logging.INFO)

formatter = logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")
file_handler.setFormatter(formatter)

if not logger.hasHandlers():
    logger.addHandler(file_handler)


def validate_json_payload(*required_fields):
    """
    Decorator to validate JSON payload.

    Args:
        *required_fields: Required fields in the JSON payload
    """

    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            if not request.is_json:
                logger.warning("Request content-type is not application/json")
                return (
                    jsonify({"status": "error", "message": "Request must be JSON"}),
                    400,
                )

            data = request.json

            # Check if all required fields are present
            missing_fields = [field for field in required_fields if field not in data]
            if missing_fields:
                logger.warning("Missing required fields: %s", ", ".join(missing_fields))
                return (
                    jsonify(
                        {
                            "status": "error",
                            "message": f"Missing required fields: {', '.join(missing_fields)}",
                        }
                    ),
                    400,
                )

            return func(*args, **kwargs)

        return wrapper

    return decorator
