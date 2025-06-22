"""
Database retry decorator for API endpoints.
Automatically retries database operations on failure.
"""

import time
from functools import wraps
from flask import jsonify
import psycopg2

from utils.db import DatabaseManager
from utils.logger_config import get_logger

# Configure logging
logger = get_logger("db_retry")


def retry_on_db_error(max_retries=3, delay=1):
    """
    Decorator to retry database operations on failure.

    Args:
        max_retries (int): Maximum number of retry attempts
        delay (int): Delay between retries in seconds

    Returns:
        Function: Decorated function that implements retry logic
    """

    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            attempts = 0
            while attempts < max_retries:
                try:
                    return func(*args, **kwargs)
                except psycopg2.Error as e:
                    attempts += 1
                    logger.warning(
                        "Database operation failed (attempt %s/%s): %s",
                        attempts,
                        max_retries,
                        e,
                    )

                    connection = DatabaseManager.get_connection()
                    connection.rollback()
                    DatabaseManager.release_connection(connection)

                    if attempts >= max_retries:
                        logger.error(
                            "Max retries reached for database operation: %s", e
                        )
                        break
                    time.sleep(delay)
            return (
                jsonify({"status": "error", "message": "Database operation failed"}),
                500,
            )

        return wrapper

    return decorator
