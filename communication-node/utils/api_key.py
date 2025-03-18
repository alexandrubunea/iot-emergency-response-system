"""
Generate a random api_key and stores it in the database.
"""

from utils.db import connection
import psycopg2


def check_api_key(key: str) -> bool:
    """
    Checks if an API key exists in the database.

    Returns:
        Bool: True if the API key exists, False otherwise.
    """
    try:
        with connection.cursor() as cur:
            cur.execute("SELECT 1 FROM api_keys WHERE key = %s LIMIT 1", (key,))
            return cur.fetchone() is not None
    except psycopg2.Error as e:
        print(f"Database error: {e}")
        return False
