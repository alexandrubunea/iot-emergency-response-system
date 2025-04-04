"""
Authentication decorator for API endpoints.
Validates API keys in request headers against the database.
"""

import logging
from functools import wraps
from flask import request, jsonify

from utils.api_key import check_api_key

# Configure logging
logger = logging.getLogger("auth_decorator")
logger.setLevel(logging.INFO)

file_handler = logging.FileHandler("auth_api.log")
file_handler.setLevel(logging.INFO)

formatter = logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")
file_handler.setFormatter(formatter)

if not logger.hasHandlers():
    logger.addHandler(file_handler)


def validate_auth_header(required_access_level=0):
    """
    Decorator to validate authorization header and API key.

    Args:
        required_access_level (int): Minimum access level required

    Returns:
        Function: Decorated function that validates the API key before proceeding
    """

    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            auth_header = request.headers.get("Authorization")

            if not auth_header or not auth_header.lower().startswith("bearer "):
                logger.warning("Invalid Authorization header format")
                return (
                    jsonify(
                        {
                            "status": "error",
                            "message": "Invalid Authorization header format",
                        }
                    ),
                    400,
                )

            _, api_key = auth_header.split(" ", 1)

            if not check_api_key(api_key, required_access_level):
                logger.warning(
                    "Invalid API key or insufficient access level: %s...", api_key[:8]
                )
                return (
                    jsonify(
                        {
                            "status": "error",
                            "message": "Invalid API key or insufficient access level",
                        }
                    ),
                    401,
                )

            return func(*args, **kwargs)

        return wrapper

    return decorator
