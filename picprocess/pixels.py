from PIL import Image
from web.db.models import *

class Pixels:
    def get_pixels_from_img(self, picture):
        self.picture = picture

        image = Image.open(picture.path)
        width, height = image.size
        small_height = height * picture.width / width
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

    def load_from_db(self, picture):
        self.pixels = []
        for p in picture.pixels:
            self.pixels.append({
                'x': p.column,
                'y': p.row,
                'color': (p.r, p.g, p.b),
            })

    def save_to_db(self):
        ids_to_delete = [f.id for f in self.picture.pixels]
        Pixel.delete().where(Pixel.id << ids_to_delete).execute()

        for p in self.pixels:
            r = p['color'][0]
            g = p['color'][1]
            b = p['color'][2]
            pixel = Pixel.create(picture=self.picture, row=p['y'], column=p['x'], r=r, g=g, b=b)