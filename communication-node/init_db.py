"""
Initialize the database that will be used by the communication node (API Server).
"""

import sys
import psycopg2

# Database Configuration
# WARNING: Do not put sensitive data in development!
DATABASE_HOST = "127.0.0.1"
DATABASE_NAME = "watchsec"
DATABASE_USER = "postgres"
DATABASE_PASSWORD = "postgres"

# Check if the connection is valid

try:
    connection = psycopg2.connect(
        host=DATABASE_HOST,
        database=DATABASE_NAME,
        user=DATABASE_USER,
        password=DATABASE_PASSWORD,
    )
except psycopg2.Error as err:
    print(f"Error occured while trying to connect to the database: \n\t{err}")
    sys.exit()

print("Database connection established.")

# Open a cursor to perform operations
cur = connection.cursor()

# Create employees table
# Table Structure:
# id: int, primary key
# first_name: varchar(255)
# last_name: varchar(255)
# access_token: varchar(512)

cur.execute("DROP TABLE IF EXISTS employees;")
cur.execute(
    "CREATE TABLE employees (id serial PRIMARY KEY,"
    "first_name varchar (255) NOT NULL,"
    "last_name varchar (255) NOT NULL,"
    "access_token varchar (512) NOT NULL);"
)
print("Table `employees` created with success.")

# Create businesses table
# Table Structure:
# id: int, primary key
# name: varchar(255)
# latitude: float8
# longitude: float8

cur.execute("DROP TABLE IF EXISTS businesses CASCADE;")
cur.execute(
    "CREATE TABLE businesses (id serial PRIMARY KEY,"
    "name varchar (255) NOT NULL,"
    "latitude float8 NOT NULL,"
    "longitude float8 NOT NULL);"
)
print("Table `businesses` created with success.")

# Create security devices table
# Table structure:
# id: int, primary key
# api_key: varchar(512)
# location: varchar(255)
# motion_sensor: bool
# sound_sensor: bool
# gas_sensor: bool
# fire_sensor: bool
# business_id: int, foreign key to business(id)

cur.execute("DROP TABLE IF EXISTS security_devices;")
cur.execute(
    "CREATE TABLE security_devices (id serial PRIMARY KEY,"
    "api_key varchar (512) NOT NULL,"
    "location varchar(255) NOT NULL,"
    "motion_sensor bool NOT NULL,"
    "sound_sensor bool NOT NULL,"
    "gas_sensor bool NOT NULL,"
    "fire_sensor bool NOT NULL,"
    "business_id int NOT NULL,"
    "CONSTRAINT fk_business FOREIGN KEY(business_id) REFERENCES businesses(id));"
)
print("Table `security_devices` created with success.")

# Commit changes & close connection
connection.commit()
cur.close()
connection.close()

print("All tables created successfully.")
