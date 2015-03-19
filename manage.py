from flask.ext.script import Manager
from web.app import app
from web.logger import get_logger
from web.db import scripts

from web.db.models import *

from picprocess.pixels import Pixels
from picprocess.palette import Palette

manager = Manager(app)

@manager.command
def hello():
    """
    Print hello
    """
    get_logger().debug("Hello debug")
    get_logger().info("Hello info")
    get_logger().warning("Hello warning")
    get_logger().error("Hello error")
    get_logger().critical("Hello critical")
    print "hello"


@manager.command
def initdb():
    """
    Drop and create database
    """
    scripts.init_database()


@manager.command
def clear():
    """
    Clear images
    """


if __name__ == "__main__":
    manager.run()
