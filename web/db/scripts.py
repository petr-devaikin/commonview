from ..logger import get_logger
from .models import *
from .engine import get_db
from playhouse.migrate import *
from peewee import *

def drop_tables():
    print 'Start drop tables'

    if Fragment.table_exists():
        Fragment.drop_table()
        get_logger().info('Fragment table dropped')

    if Picture.table_exists():
        Picture.drop_table()
        get_logger().info('Picture table dropped')

    #if User.table_exists():
    #    User.drop_table()
    #    get_logger().info('User table dropped')


def create_tables():
    print 'Start create tables'

    #User.create_table()
    #get_logger().info('User table created')

    Picture.create_table()
    get_logger().info('Picture table created')

    Fragment.create_table()
    get_logger().info('Fragment table created')


def migrate_1():
    print 'Start migration'

    migrator = SqliteMigrator(get_db())
    export_generated = DateTimeField(null=True)
    migrate(
        migrator.add_column('picture', 'export_generated', export_generated),
    )



def init_data():
    pass


def init_database():
    print 'Start init db'
    drop_tables()
    create_tables()
    init_data()
