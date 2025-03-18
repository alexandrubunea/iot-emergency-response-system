"""
Initialize the database that will be used by the communication node.
"""

import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from utils.db import connection  # noqa: E402 # pylint: disable=wrong-import-position

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
# address: varchar(255)

cur.execute("DROP TABLE IF EXISTS businesses CASCADE;")
cur.execute(
    "CREATE TABLE businesses (id serial PRIMARY KEY,"
    "name varchar (255) NOT NULL,"
    "latitude float8 NOT NULL,"
    "longitude float8 NOT NULL,"
    "address varchar (255) NOT NULL);"
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
    "name varchar(255) NOT NULL,"
    "motion_sensor bool NOT NULL,"
    "sound_sensor bool NOT NULL,"
    "gas_sensor bool NOT NULL,"
    "fire_sensor bool NOT NULL,"
    "business_id int NOT NULL,"
    "CONSTRAINT fk_business FOREIGN KEY(business_id) REFERENCES businesses(id));"
)
print("Table `security_devices` created with success.")

# Create API Keys table
# Table structure:
# id: int, primary key
# key: varchar(64)
# access_level: int (lower = more access)
cur.execute("DROP TABLE IF EXISTS api_keys;")
cur.execute(
    "CREATE TABLE api_keys (id serial PRIMARY KEY,"
    "key varchar (64) NOT NULL,"
    "access_level int NOT NULL);"
)
print("Table `api_keys` created with success.")

# Commit changes & close connection
connection.commit()
cur.close()
connection.close()

print("All tables created successfully.")
