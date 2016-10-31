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
    current_page = CharField(null=True, default=1)
    global_diff = DoubleField(null=True)
    updated = DateTimeField(null=True)
    export_generated = DateTimeField(null=True)
    image = BlobField()

    def fragment_width(self):
        return int(math.floor(float(self.width) / current_app.config['GROUP_SIZE']))

    def fragment_height(self):
        return int(math.floor(float(self.height) / current_app.config['GROUP_SIZE']))

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
    x = IntegerField()
    y = IntegerField()
    source_pic = BlobField()
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
            'diff': self.diff,
            'lobsterId': self.lobster_id,
            'lobsterImg': self.lobster_img,
            'lobsterUrl': self.lobster_url,
            'lowPic': [ord(c) for c in self.low_pic] if self.low_pic != None else None
        }


    _lab = None
    def get_lab(self):
        if _lab != None:
            return _lab

        _lab = ImageHelper.calc_lab(low_pic)

        return _lab


    def calc_diff(self, other_pic_lab):
        self_lab = self.get_lab()
        if len(self_lab) != len(other_pic_lab):
            return None

        result = 0
        for i in xrange(len(other_pic_lab)):
            result += ImageHelper.calc_difference(self_lab[i], other_pic_lab[i])
        return result


    def set_image(self, image, diff):
        self.lobster_id = image['lobster_id']
        self.lobster_img = image['lobster_img']
        self.lobster_url = image['lobster_url']
        self.low_pic = image['low_pic']
        self.high_pic = image['high_pic']
        self._lab = image['lab_pic']
        self.diff = diff


    def is_set(self):
        return self.diff != None


    class Meta:
        database = get_db()
