"""
Logger configuration module for the communication node.
"""

import logging
import os
import sys
from dotenv import load_dotenv

load_dotenv()

if os.getenv("DISABLE_LOGGING") == "true":
    logging.disable(logging.CRITICAL)


def get_logger(name: str) -> logging.Logger:
    """
    Returns a logger instance with the specified name.
    """
    logger = logging.getLogger(name)
    logger.setLevel(logging.INFO)

    if not logger.hasHandlers():
        handler = logging.StreamHandler(sys.stderr)
        handler.setLevel(logging.INFO)
        formatter = logging.Formatter(
            "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)

    return logger
