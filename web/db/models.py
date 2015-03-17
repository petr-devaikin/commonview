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
    width = IntegerField()
    height = IntegerField()
    tag = CharField(null=True)
    next_tag_id = CharField(null=True)
    global_diff = DoubleField(null=True)
    updated = DateTimeField(null=True)

    def get_path(self):
        return '%d_%d.png' % (self.user.id, self.id)

    def get_full_path(self):
        return os.path.join(current_app.config['UPLOAD_FOLDER'], self.get_path())

    def get_export_path(self):
        return os.path.join(current_app.config['UPLOAD_FOLDER'], 'e_'+self.get_path())

    def diff_percentage(self):
        return round(100 * (255 - self.global_diff) / 255, 1) if self.global_diff != None else 0

    class Meta:
        database = get_db()


class Fragment(Model):
    picture = ForeignKeyField(Picture, related_name='fragments')
    x = IntegerField()
    y = IntegerField()
    diff = IntegerField()
    insta_id = CharField()
    insta_img = CharField()
    insta_url = CharField()
    insta_user = CharField()

    def to_hash(self):
        return {
            'x': self.x,
            'y': self.y,
            'diff': self.diff,
            'image': {
                'id': self.insta_id,
                'imageUrl': self.insta_img,
                'link': self.insta_url,
                'userName': self.insta_user,
            }
        }

    def from_hash(self, data):
        self.x = data['x']
        self.y = data['y']
        self.diff = data['diff']

        self.insta_id = data['image']['id']
        self.insta_img = data['image']['imageUrl']
        
        self.insta_url = data['image']['link']
        if not current_app.config['ALLOWED_INSTA_URL'].match(self.insta_url):
            return False
        
        self.insta_user = data['image']['userName']

        return True


    class Meta:
        database = get_db()
        indexes = (
            (('picture', 'x', 'y'), True),
        )
