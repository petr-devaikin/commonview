from PIL import Image
from web.db.models import *
import cStringIO

class Pixels:
    def get_pixels_from_img(self, picture):
        image = Image.open(cStringIO.StringIO(picture.image))
        self.width, self.height = image.size

        self.pixels = []
        for i in xrange(self.width):
            for j in xrange(self.height):
                pixel = image.getpixel((i, j))
                self.pixels.append({
                    'x': i,
                    'y': j,
                    'color': pixel,
                })

    def to_hash(self):
        return {
            'width': self.width,
            'height': self.height,
            'pixels': self.pixels,
        }
