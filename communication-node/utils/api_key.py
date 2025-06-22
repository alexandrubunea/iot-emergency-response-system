"""
API key validation utilities for the security system.
Handles validation and tracking of API key usage.
"""

from datetime import datetime
import psycopg2
from utils.db import DatabaseManager
from utils.logger_config import get_logger

# Configure logging
logger = get_logger("api_key_validator")


def check_api_key(key: str, required_access_level: int = None) -> bool:
    """
    Checks if an API key exists and has sufficient access level.
    Updates the last_used_at timestamp when a key is successfully validated.

    Args:
        key (str): The API key to check
        required_access_level (int, optional): If provided, checks if the key has
                                              this access level or better (lower number)

    Returns:
        bool: True if the API key is valid and has sufficient access, False otherwise
    """
    if not key:
        logger.warning("Empty API key provided")
        return False

    connection = DatabaseManager.get_connection()

    try:
        with connection.cursor() as cur:
            # If access level is required, check it
            if required_access_level is not None:
                cur.execute(
                    """
                    SELECT id FROM api_keys
                    WHERE api_key = %s AND access_level <= %s
                    LIMIT 1
                    """,
                    (key, required_access_level),
                )
            else:
                cur.execute(
                    "SELECT id FROM api_keys WHERE api_key = %s LIMIT 1", (key,)
                )

            result = cur.fetchone()
            valid = result is not None

            # Update last_used_at timestamp if key is valid
            if valid:
                cur.execute(
                    "UPDATE api_keys SET last_used_at = %s WHERE api_key = %s",
                    (datetime.now(), key),
                )
                connection.commit()
                logger.info("API key validated successfully: %s...", key[:8])
            else:
                logger.warning(
                    "Invalid API key or insufficient access level: %s...", key[:8]
                )

            return valid
    except psycopg2.Error as e:
        logger.error("Database error validating API key: %s", e)
        connection.rollback()

        return False
    finally:
        DatabaseManager.release_connection(connection)
