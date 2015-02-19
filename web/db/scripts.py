from ..logger import get_logger
from .models import *

def drop_tables():
    if Fragment.table_exists():
        Fragment.drop_table()
        get_logger().info('Fragment table dropped')

    if Pixel.table_exists():
        Pixel.drop_table()
        get_logger().info('Pixel table dropped')
        
    if Picture.table_exists():
        Picture.drop_table()
        get_logger().info('Picture table dropped')


def create_tables():
    Picture.create_table()
    get_logger().info('Picture table created')

    Fragment.create_table()
    get_logger().info('Fragment table created')

    Pixel.create_table()
    get_logger().info('Pixel table created')


def init_data():
    pass


def init_database():
    drop_tables()
    create_tables()
    init_data()