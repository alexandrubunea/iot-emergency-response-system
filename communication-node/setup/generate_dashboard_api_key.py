"""
Generates an API KEY that can be used by the dashboard.
"""

import sys
import os
import uuid
import hashlib
import psycopg2

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from utils.db import connection  # noqa: E402 # pylint: disable=wrong-import-position

GENERATED_KEY = hashlib.sha256(str(uuid.uuid4()).encode()).hexdigest()[:64]
ACCESS_LEVEL = 0

try:
    with connection.cursor() as cur:
        cur.execute(
            "INSERT INTO api_keys(key, access_level) VALUES(%s, %s)",
            (
                GENERATED_KEY,
                ACCESS_LEVEL,
            ),
        )
        connection.commit()
except psycopg2.Error as e:
    print(f"Database error: {e}")
    sys.exit()

print("Your API KEY is:", GENERATED_KEY)
