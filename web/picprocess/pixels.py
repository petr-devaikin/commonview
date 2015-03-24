from PIL import Image
from web.db.models import *
import cStringIO
from flask import current_app

class Pixels:
    def get_pixels_from_img(self, picture):
        image = Image.open(cStringIO.StringIO(picture.image))

        group_size = current_app.config['GROUP_SIZE']

        def get_pixel(column, row, x, y):
            if x + column * group_size < picture.width and y + row * group_size < picture.height:
                return image.getpixel((x + column * group_size, y + row * group_size))
            else:
                return (0, 0, 0)

        self.pixel_groups = []
        for i in xrange(picture.fragment_width()):
            for j in xrange(picture.fragment_height()):
                colors = [c for y in xrange(group_size) for x in xrange(group_size) for c in get_pixel(i, j, x, y)]
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