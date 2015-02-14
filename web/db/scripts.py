from ..logger import get_logger
from .models import *

def drop_tables():
    if Picture.table_exists():
        Picture.drop_table()
        get_logger().info('Picture table dropped')

    if Fragment.table_exists():
        Fragment.drop_table()
        get_logger().info('Fragment table dropped')


def create_tables():
    Picture.create_table()
    get_logger().info('Picture table created')

    Fragment.create_table()
    get_logger().info('Fragment table created')


def init_data():
    pass


def init_database():
    drop_tables()
    create_tables()
    init_data()