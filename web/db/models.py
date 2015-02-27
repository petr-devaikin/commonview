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
    next_tag_id = CharField(null=True)
    global_diff = DoubleField(null=True)
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
    diff = IntegerField()
    insta_id = CharField()
    insta_img = CharField()
    insta_url = CharField()
    insta_user = CharField()

    def to_hash(self):
        return {
            'x': self.column,
            'y': self.row,
            'diff': self.diff,
            'image': {
                'id': self.insta_id,
                'imageUrl': self.insta_img,
                'link': self.insta_url,
                'userName': self.insta_user,
            }
        }

    def from_hash(self, data):
        self.column = data['x']
        self.row = data['y']
        self.diff = data['diff']

        self.insta_id = data['image']['id']
        self.insta_img = data['image']['imageUrl']
        self.insta_url = data['image']['link']
        self.insta_user = data['image']['userName']

    class Meta:
        database = get_db()
