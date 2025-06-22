"""
Database connection utilities.
Provides a robust PostgreSQL connection pool with configuration management.
"""

import os
import logging
import sys
import psycopg2
from dotenv import load_dotenv
from psycopg2 import pool

# Configure logging
logger = logging.getLogger("database")
logger.setLevel(logging.INFO)

stream_handler = logging.StreamHandler(sys.stderr)
stream_handler.setLevel(logging.INFO)

formatter = logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")
stream_handler.setFormatter(formatter)

if not logger.hasHandlers():
    logger.addHandler(stream_handler)

# Default connection parameters
DEFAULT_MIN_CONNECTIONS = 1
DEFAULT_MAX_CONNECTIONS = 10
DEFAULT_CONNECTION_TIMEOUT = 30


class DatabaseManager:
    """
    Manages database connections using connection pooling for better performance and reliability.
    """

    _connection_pool = None

    @classmethod
    def initialize_pool(cls, min_connections: int = None, max_connections: int = None):
        """
        Initialize the connection pool with the specified parameters.

        Args:
            min_connections (int): Minimum number of connections to maintain
            max_connections (int): Maximum number of connections allowed
        """
        if cls._connection_pool is not None:
            logger.info("Connection pool already initialized")
            return

        # Use default values if not specified
        min_conn = min_connections or int(
            os.getenv("DB_MIN_CONNECTIONS", str(DEFAULT_MIN_CONNECTIONS))
        )
        max_conn = max_connections or int(
            os.getenv("DB_MAX_CONNECTIONS", str(DEFAULT_MAX_CONNECTIONS))
        )

        load_dotenv()

        try:
            db_config = {
                "host": os.getenv("DATABASE_HOST"),
                "database": os.getenv("DATABASE_NAME"),
                "user": os.getenv("DATABASE_USER"),
                "password": os.getenv("DATABASE_PASSWORD"),
                "port": os.getenv("DATABASE_PORT", "5432"),
                "connect_timeout": int(
                    os.getenv("DATABASE_TIMEOUT", str(DEFAULT_CONNECTION_TIMEOUT))
                ),
            }

            # Log connection attempt (without sensitive information)
            safe_config = db_config.copy()
            if "password" in safe_config:
                safe_config["password"] = "******"
            logger.info("Initializing connection pool with config: %s", safe_config)

            # Create the connection pool
            cls._connection_pool = pool.ThreadedConnectionPool(
                min_conn, max_conn, **db_config
            )

            logger.info(
                "Connection pool initialized with %s-%s connections", min_conn, max_conn
            )

        except psycopg2.Error as err:
            logger.error("Failed to initialize connection pool: %s", err)
            raise

    @classmethod
    def get_connection(cls):
        """
        Get a connection from the pool. Initialize the pool if it doesn't exist yet.

        Returns:
            connection: A PostgreSQL database connection
        """
        if cls._connection_pool is None:
            cls.initialize_pool()

        try:
            connection = cls._connection_pool.getconn()
            logger.debug("Retrieved connection from pool")
            return connection
        except psycopg2.pool.PoolError as err:
            logger.error("Failed to get connection from pool: %s", err)
            raise

    @classmethod
    def release_connection(cls, connection):
        """
        Return a connection to the pool.

        Args:
            connection: The connection to return to the pool
        """
        if cls._connection_pool is not None:
            cls._connection_pool.putconn(connection)
            logger.debug("Released connection back to pool")

    @classmethod
    def close_all_connections(cls):
        """Close all connections in the pool and shut down the pool."""
        if cls._connection_pool is not None:
            cls._connection_pool.closeall()
            cls._connection_pool = None
            logger.info("All connections closed and pool shut down")
