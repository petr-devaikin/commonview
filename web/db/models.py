from peewee import *
from .engine import get_db


class Picture(Model):
    path = CharField()

    class Meta:
        database = get_db()


class Pixel(Model):
    picture = ForeignKeyField(Picture, related_name='pixels')
    row = IntegerField()
    column = IntegerField()
    r = IntegerField()
    g = IntegerField()
    b = IntegerField()

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
            'color': (self.r, self.g, self.b),
            'img': self.insta_img,
            'url': self.insta_url,
        }

    class Meta:
        database = get_db()
