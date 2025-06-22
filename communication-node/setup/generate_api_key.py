#!/usr/bin/env python3
"""
Generates an API key that can be used by dashboard or testing.
Securely stores the API key in the database with the specified access level.

Access Rights Table:
----------------------------------------------------
| Access Level | Create  | Add     | Send    |
|              | Business| Device  | Alerts  |
----------------------------------------------------
| 0            | YES     | NO      | NO      |
----------------------------------------------------
| 1            | NO      | YES     | NO      |
----------------------------------------------------
| 2            | NO      | NO      | YES     |
----------------------------------------------------

Reading Rights Table:
----------------------------------------------------
| Access Level | Read    | Read    | Read    |
|              | Business| Device  | Alerts  |
----------------------------------------------------
| 0            | YES     | YES     | YES     |
----------------------------------------------------
| 1            | YES     | YES     | NO      |
----------------------------------------------------
| 2            | NO      | NO      | NO      |
----------------------------------------------------

Lower access level numbers have more specific permissions, not necessarily higher privileges.
"""

import sys
import os
import uuid
import hashlib
import argparse
from datetime import datetime
from textwrap import dedent
import psycopg2
from utils.logger_config import get_logger

# Setup logging
logger = get_logger("generate_api_key")

# Add parent directory to path for imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from utils.db import (  # noqa: E402 # pylint: disable=wrong-import-position
    DatabaseManager,  # noqa: E402 # pylint: disable=wrong-import-position
)  # noqa: E402 # pylint: disable=wrong-import-position


def display_access_rights_table():
    """Display the access rights table in a formatted way."""
    table = """
    Access Rights Table:
    ----------------------------------------------------
    | Access Level | Create  | Add     | Send    |
    |              | Business| Device  | Alerts  |
    ----------------------------------------------------
    | 0            | YES     | NO      | NO      |
    ----------------------------------------------------
    | 1            | NO      | YES     | NO      |
    ----------------------------------------------------
    | 2            | NO      | NO      | YES     |
    ----------------------------------------------------

    Reading Rights Table:
    ----------------------------------------------------
    | Access Level | Read    | Read    | Read    |
    |              | Business| Device  | Alerts  |
    ----------------------------------------------------
    | 0            | YES     | YES     | YES     |
    ----------------------------------------------------
    | 1            | YES     | YES     | NO      |
    ----------------------------------------------------
    | 2            | NO      | NO      | NO      |
    ----------------------------------------------------
    """
    return dedent(table)


def generate_api_key(access_level=0, description="API Key used by dashboard"):
    """
    Generate a secure API key and store it in the database.

    Args:
        access_level (int): The access level for this key (specific permissions)
        description (str): Optional description of this API key's purpose

    Returns:
        str: The generated API key
    """
    # Generate a secure random key using UUID and SHA-256
    api_key = hashlib.sha256(str(uuid.uuid4()).encode()).hexdigest()[:64]

    connection = DatabaseManager.get_connection()

    try:
        with connection.cursor() as cur:
            cur.execute(
                """
                INSERT INTO api_keys(api_key, access_level, created_at, description)
                VALUES(%s, %s, %s, %s)
                """,
                (api_key, access_level, datetime.now(), description),
            )
            connection.commit()
            logger.info("API key generated with access level %s", access_level)

            return api_key
    except Exception as e:
        connection.rollback()
        logger.error("Error generating API key: %s", e)

        raise
    finally:
        DatabaseManager.release_connection(connection)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate a new API key")
    parser.add_argument(
        "--level",
        type=int,
        default=0,
        help="Access level (0=create business, 1=add device, 2=send alerts)",
    )
    parser.add_argument("--description", type=str, help="Description of this API key")
    args = parser.parse_args()

    # Display access rights table
    print(display_access_rights_table())

    try:
        DatabaseManager.initialize_pool()

        conn = DatabaseManager.get_connection()

        # Test the connection to ensure it's working
        with conn.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()

        logger.info("Database connection established successfully")
    except psycopg2.Error as err:
        logger.critical("Error occurred while connecting to the database: %s", err)
        print(f"Error occurred while connecting to the database: \n\t{err}")

        sys.exit(1)
    finally:
        DatabaseManager.release_connection(conn)

    try:
        KEY = generate_api_key(args.level, args.description)
        print("\n==== API KEY GENERATED ====")
        print(f"API Key: {KEY}")
        print(f"Access Level: {args.level}")

        # Display the specific permissions for this access level
        if args.level == 0:
            print("Permissions: Create business, Read all data")
        elif args.level == 1:
            print("Permissions: Add device, Read business and device data")
        elif args.level == 2:
            print("Permissions: Send alerts")
        else:
            print(f"Custom permission level: {args.level}")

        print("==========================\n")
        print("Store this key securely. It cannot be retrieved later.")
    except Exception as e:
        print(f"Failed to generate API key: {e}")

        sys.exit(1)
