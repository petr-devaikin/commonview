from PIL import Image
from web.db.models import *

class Pixels:
    def get_pixels_from_img(self, picture):
        image = Image.open(picture.path)
        self.width, self.height = image.size
        small_height = self.height * picture.width / self.width
        small_img = image.resize((picture.width, small_height), Image.ANTIALIAS)

        self.pixels = []
        for i in range(picture.width):
            for j in range(small_height):
                pixel = small_img.getpixel((i, j))
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