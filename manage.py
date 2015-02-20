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


@manager.option('-f', '--filename', help='File name')
@manager.option('-t', '--tag', help='Tag name')
@manager.option('-w', '--width', help='Image result width')
def loadimg(filename, tag, width):
    """
    Load new image
    """
    from os import listdir
    from os.path import join

    path = filename
    try:
        picture = Picture.get(Picture.path == path)
    except Picture.DoesNotExist:
        picture = Picture.create(path=path, tag=tag, width=width)

    #pixels = Pixels()
    #pixels.get_pixels_from_img(picture, app.config['IMAGE_WIDTH'])
    #pixels.save_to_db()


@manager.command
def updateimg():
    """
    Update images
    """
    pictures = [p for p in Picture.select().where(Picture.updated==None)]
    for picture in pictures:
        print picture.id
        palette = Palette(picture)
        palette.generate()
        palette.fill(app.config)
        palette.save_to_db()


if __name__ == "__main__":
    manager.run()
