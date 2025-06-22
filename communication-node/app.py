"""
Flask application for handling API requests in the communication node.
"""

import logging
import sys
from flask import Flask
import psycopg2
from dotenv import load_dotenv

from routes.configurator import configurator_bp
from routes.dashboard import dashboard_bp
from routes.device import device_bp
from utils.db import DatabaseManager

load_dotenv()

app = Flask(__name__)

app.register_blueprint(configurator_bp)
app.register_blueprint(dashboard_bp)
app.register_blueprint(device_bp)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    filename="app.log",
)

logger = logging.getLogger("app")

if __name__ == "__main__":
    try:
        DatabaseManager.initialize_pool()

        # Test the connection to ensure it's working
        connection = DatabaseManager.get_connection()
        with DatabaseManager.get_connection().cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
        DatabaseManager.release_connection(connection)

        logger.info("Database connection established successfully")

    except psycopg2.Error as err:
        logger.critical("Error occurred while connecting to the database: %s", err)
        print(f"Error occurred while connecting to the database: \n\t{err}")
        sys.exit(1)

    finally:
        DatabaseManager.close_all_connections()

    app.run(host="0.0.0.0", port=8000, debug=False)
