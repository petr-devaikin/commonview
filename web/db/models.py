from peewee import *
from .engine import get_db
from flask import current_app
import os


class User(Model):
    insta_id = CharField()
    insta_name = CharField()
    access_token = CharField()

    class Meta:
        database = get_db()


class Picture(Model):
    user = ForeignKeyField(User, related_name='pictures')
    tag = CharField(null=True)
    updated = DateTimeField(null=True)

    def get_path(self):
        return '%d_%d.jpg' % (self.user.id, self.id)

    def get_full_path(self):
        return os.path.join(current_app.config['UPLOAD_FOLDER'], self.get_path())

    class Meta:
        database = get_db()


class Fragment(Model):
    picture = ForeignKeyField(Picture, related_name='fragments')
    row = IntegerField()
    column = IntegerField()
    insta_id = CharField(null=True)
    insta_img = CharField(null=True)
    insta_url = CharField(null=True)
    insta_user = CharField(null=True)

    def to_hash(self):
        return {
            'x': self.column,
            'y': self.row,
            'img': self.insta_img,
            'url': self.insta_url,
        }

    class Meta:
        database = get_db()
