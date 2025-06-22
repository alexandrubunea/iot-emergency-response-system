"""
Authentication decorator for API endpoints.
Validates API keys in request headers against the database.
"""

from functools import wraps
from flask import request, jsonify

from utils.api_key import check_api_key
from utils.logger_config import get_logger

# Configure logging
logger = get_logger("validate_auth")


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
