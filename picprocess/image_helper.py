from PIL import Image
import StringIO
from flask import current_app

class ImageHelper:
    @staticmethod
    def resize(f, max_size):
        img = Image.open(f)
        w, h = img.size
        if w >= h and w > max_size:
            img.thumbnail((max_size, h * max_size / w))
        elif h >= w and h > max_size:
            img.thumbnail((w * max_size / h, max_size))
        return img

    @staticmethod
    def new_export_image(width, height):
        return Image.new('RGBA',
            (width * current_app.config['EXPORT_GROUP_SIZE'] / current_app.config['GROUP_SIZE'],
             height * current_app.config['EXPORT_GROUP_SIZE'] / current_app.config['GROUP_SIZE']))

    @staticmethod
    def save_export_image(path, data, width, height):
        st = StringIO.StringIO(data[22:].decode('base64'))
        export = Image.open(st)
        #Check image size 1!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
        export.save(path)

    @staticmethod
    def load_image(path):
        return Image.open(path)
        