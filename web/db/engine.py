from peewee import *
from playhouse.db_url import connect

_db = Proxy()

def init_db(app):
    _db.initialize(connect(app.config['DATABASE_URI']))

def get_db():
    return _db