from PIL import Image
from web.db.models import *
import cStringIO
from flask import current_app

class Pixels:
    def get_pixels_from_img(self, picture):
        image = Image.open(cStringIO.StringIO(picture.image))

        group_size = current_app.config['GROUP_SIZE']

        self.pixel_groups = []
        for i in xrange(picture.fragment_width()):
            for j in xrange(picture.fragment_height()):
                colors = [c for y in xrange(group_size) for x in xrange(group_size) for c in image.getpixel((x + i * group_size, y + j * group_size))]
                self.pixel_groups.append({
                    'x': i,
                    'y': j,
                    'colors': colors,
                })

    def get_empty_pixels(self, picture):
        image = Image.open(cStringIO.StringIO(picture.image))

        group_size = current_app.config['GROUP_SIZE']
        self.pixel_groups = [{ 'x': i, 'y': j, 'colors': [] } for i in xrange(picture.fragment_width()) for j in xrange(picture.fragment_height())]

    def to_hash(self):
        return self.pixel_groups