"""
Flask application for handling API requests in the communication node.
"""

from flask import Flask
from routes.configurator import configurator_bp
from routes.dashboard import dashboard_bp

app = Flask(__name__)

app.register_blueprint(configurator_bp)
app.register_blueprint(dashboard_bp)

if __name__ == "__main__":
    app.run()
