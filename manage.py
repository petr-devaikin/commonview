from flask.ext.script import Manager
from web.app import app
from web.logger import get_logger
from web.db import scripts

from web.db.models import *
from picprocessor import *

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
def loadimg():
    """
    Load new images
    """
    from os import listdir
    from os.path import join

    folder = 'img/'
    for f in listdir(folder):
        path = join(folder, f)
        try:
            picture = Picture.get(Picture.path == path)
        except Picture.DoesNotExist:
            picture = Picture.create(path=path)

        pixels = Pixels()
        pixels.get_pixels_from_img(picture, app.config['IMAGE_WIDTH'])
        pixels.save_to_db()


@manager.command
def updateimg():
    """
    Update images
    """
    picture = Picture.get()
    palette = Palette(picture)
    palette.generate()
    palette.fill(app.config, 'london')
    palette.save_to_db()


if __name__ == "__main__":
    manager.run()
