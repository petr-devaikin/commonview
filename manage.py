from flask.ext.script import Manager
from web.app import app
from web.logger import get_logger
from web.db import scripts

from web.db.models import *
from picprocessor import *

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

        ids_to_delete = [f.id for f in picture.fragments]
        Fragment.delete().where(Fragment.id << ids_to_delete).execute()
        palette = get_palette(path, 10)

        save_palette_to_db(picture, palette)


@manager.command
def updateimg():
    """
    Update images
    """
    picture = Picture.get()
    palette = load_palette_from_db(picture)
    fill_palette(palette, app.config, 'london')
    save_palette_to_db(picture, palette)


if __name__ == "__main__":
    manager.run()
