"""
Establish connection with the database.
"""

import os
import sys
import psycopg2
from dotenv import load_dotenv

load_dotenv()

try:
    connection = psycopg2.connect(
        host=os.getenv("DATABASE_HOST"),
        database=os.getenv("DATABASE_NAME"),
        user=os.getenv("DATABASE_USER"),
        password=os.getenv("DATABASE_PASSWORD"),
    )
except psycopg2.Error as err:
    print(f"Error occured while trying to connect to the database: \n\t{err}")
    sys.exit()
print("Database connection established.")
