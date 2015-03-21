from flask import current_app
from logging.handlers import TimedRotatingFileHandler
import logging


def get_logger():
    return current_app.logger


def set_logger_params(app):
    if app.config['LOGGER']['DEBUG_PATH'] != None:
        debug_handler = TimedRotatingFileHandler(app.config['LOGGER']['DEBUG_PATH'], when='midnight', interval=1)
        debug_handler.setLevel(logging.DEBUG)
        debug_handler.setFormatter(logging.Formatter(app.config['LOGGER']['FORMAT']))
        app.logger.addHandler(debug_handler)

    if app.config['LOGGER']['PATH'] != None:
        handler = TimedRotatingFileHandler(app.config['LOGGER']['PATH'], when='midnight', interval=1)
        handler.setLevel(logging.INFO)
        handler.setFormatter(logging.Formatter(app.config['LOGGER']['FORMAT']))
        app.logger.addHandler(handler)