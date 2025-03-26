#!/usr/bin/env python3
"""
Initialize the database that will be used by the security system.
Creates all required tables with proper constraints and indices.
"""
import sys
import os
import logging
import psycopg2

# Setup logging
logger = logging.getLogger("db_init")
logger.setLevel(logging.INFO)

file_handler = logging.FileHandler("setup.log")
file_handler.setLevel(logging.INFO)

formatter = logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")
file_handler.setFormatter(formatter)

if not logger.hasHandlers():
    logger.addHandler(file_handler)

# Add parent directory to path for imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from utils.db import (  # noqa: E402 # pylint: disable=wrong-import-position
    DatabaseManager,  # noqa: E402 # pylint: disable=wrong-import-position
)  # noqa: E402 # pylint: disable=wrong-import-position


def create_tables():
    """Create all required tables for the security system database."""

    connection = DatabaseManager.get_connection()

    try:
        # Open a cursor to perform operations
        cur = connection.cursor()

        # Create API Keys table
        logger.info("Creating api_keys table...")
        cur.execute("DROP TABLE IF EXISTS api_keys CASCADE;")
        cur.execute(
            """
            CREATE TABLE api_keys (
                id SERIAL PRIMARY KEY,
                api_key VARCHAR(64) NOT NULL UNIQUE,
                access_level INTEGER NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                last_used_at TIMESTAMP WITH TIME ZONE,
                description VARCHAR(255)
            );
            CREATE INDEX idx_api_keys ON api_keys(api_key);
        """
        )
        logger.info("Table `api_keys` created successfully.")

        # Create employees table
        logger.info("Creating employees table...")
        cur.execute("DROP TABLE IF EXISTS employees CASCADE;")
        cur.execute(
            """
            CREATE TABLE employees (
                id SERIAL PRIMARY KEY,
                first_name VARCHAR(255) NOT NULL,
                last_name VARCHAR(255) NOT NULL,
                api_key_id INTEGER NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                last_login_at TIMESTAMP WITH TIME ZONE,
                CONSTRAINT fk_api_key FOREIGN KEY(api_key_id) REFERENCES api_keys(id)
                ON DELETE CASCADE
            );
            CREATE INDEX idx_employees_api_key ON employees(api_key_id);
        """
        )
        logger.info("Table `employees` created successfully.")

        # Create businesses table
        logger.info("Creating businesses table...")
        cur.execute("DROP TABLE IF EXISTS businesses CASCADE;")
        cur.execute(
            """
            CREATE TABLE businesses (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                lat FLOAT8 NOT NULL,
                lon FLOAT8 NOT NULL,
                address VARCHAR(255) NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                contact_name VARCHAR(255),
                contact_email VARCHAR(255),
                contact_phone VARCHAR(50)
            );
            CREATE INDEX idx_businesses_name ON businesses(name);
        """
        )
        logger.info("Table `businesses` created successfully.")

        # Create security devices table
        logger.info("Creating security_devices table...")
        cur.execute("DROP TABLE IF EXISTS security_devices CASCADE;")
        cur.execute(
            """
            CREATE TABLE security_devices (
                id SERIAL PRIMARY KEY,
                api_key_id INTEGER NOT NULL,
                name VARCHAR(255) NOT NULL,
                motion_sensor BOOLEAN NOT NULL DEFAULT FALSE,
                sound_sensor BOOLEAN NOT NULL DEFAULT FALSE,
                gas_sensor BOOLEAN NOT NULL DEFAULT FALSE,
                fire_sensor BOOLEAN NOT NULL DEFAULT FALSE,
                business_id INTEGER NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                last_active_at TIMESTAMP WITH TIME ZONE,
                status VARCHAR(50) DEFAULT 'inactive',
                CONSTRAINT fk_business FOREIGN KEY(business_id) REFERENCES businesses(id)
                ON DELETE CASCADE,
                CONSTRAINT fk_api_key FOREIGN KEY(api_key_id) REFERENCES api_keys(id)
                ON DELETE CASCADE
            );
            CREATE INDEX idx_devices_business ON security_devices(business_id);
            CREATE INDEX idx_devices_api_key ON security_devices(api_key_id);
        """
        )
        logger.info("Table `security_devices` created successfully.")

        # Create employees table
        logger.info("Creating employees table...")
        cur.execute("DROP TABLE IF EXISTS employees CASCADE;")
        cur.execute(
            """
            CREATE TABLE employees (
                id SERIAL PRIMARY KEY,
                first_name VARCHAR(255) NOT NULL,
                last_name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL,
                phone VARCHAR(50),
                api_key_id INTEGER NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                CONSTRAINT fk_api_key FOREIGN KEY(api_key_id) REFERENCES api_keys(id)
                ON DELETE CASCADE
            );
            CREATE INDEX idx_employees_api_key ON employees(api_key_id);
        """
        )
        logger.info("Table `employees` created successfully.")

        # Commit all changes
        connection.commit()
        logger.info("All tables created successfully.")
    except Exception as e:
        connection.rollback()
        logger.error("Error creating tables: %s", e)

        raise
    finally:
        cur.close()
        DatabaseManager.release_connection(connection)


if __name__ == "__main__":
    try:
        DatabaseManager.initialize_pool()

        # Test the connection to ensure it's working
        with DatabaseManager.get_connection().cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()

        logger.info("Database connection established successfully")

    except psycopg2.Error as err:
        logger.critical("Error occurred while connecting to the database: %s", err)
        print(f"Error occurred while connecting to the database: \n\t{err}")
        sys.exit(1)

    try:
        create_tables()
        DatabaseManager.get_connection().close()
        print("Database initialization completed successfully.")
    except Exception as e:
        print(f"Database initialization failed: {e}")
        sys.exit(1)
