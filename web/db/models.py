from peewee import *
from .engine import get_db
from flask import current_app
import os
import math
from ..picprocess.image_helper import ImageHelper


'''
class User(Model):
    insta_id = CharField()
    insta_name = CharField()
    access_token = CharField()

    class Meta:
        database = get_db()
'''

class Picture(Model):
    #user = ForeignKeyField(User, related_name='pictures')
    width = IntegerField()
    height = IntegerField()
    page = IntegerField(default=1)
    global_diff = DoubleField(null=True)
    updated = DateTimeField(null=True)
    export_generated = DateTimeField(null=True)
    image = BlobField()

    def fragment_width(self):
        return self.width / current_app.config['GROUP_SIZE']

    def fragment_height(self):
        return self.height / current_app.config['GROUP_SIZE']

    def diff_percentage(self):
        r = (255 - self.global_diff) / 255 if self.global_diff != None else 0
        return round(100 * r * r, 1)

    def export_path(self):
        return '%d.png' % (self.id)

    def export_full_path(self):
        return 'export/%d.png' % (self.id)

    def belong_to_user(self, u):
        return True # self.user.id != u.id

    class Meta:
        database = get_db()


class Fragment(Model):
    picture = ForeignKeyField(Picture, related_name='fragments')
    x = IntegerField(null=True)
    y = IntegerField(null=True)
    diff = FloatField(null=True)
    lobster_id = CharField(null=True)
    lobster_img = CharField(null=True)
    lobster_url = CharField(null=True)
    low_pic = BlobField(null=True)
    high_pic = BlobField(null=True)


    def to_hash(self):
        return {
            'id': self.id,
            'x': self.x,
            'y': self.y,
            'isSet': self.is_set(),
            'externalId': self.lobster_id,
            'imageUrl': self.lobster_img,
            'link': self.lobster_url,
            'lowPic': [ord(c) for c in self.low_pic] if self.low_pic != None else None
        }


    def is_set(self):
        return self.x != None


    class Meta:
        database = get_db()
