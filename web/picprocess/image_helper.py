from PIL import Image
import cStringIO
from flask import current_app
import urllib2
import datetime
import os

class ImageHelper:
    @staticmethod
    def resize(f, max_size):
        img = Image.open(f)
        w, h = img.size
        if w >= h and w > max_size:
            img.thumbnail((max_size, h * max_size / w))
        elif h >= w and h > max_size:
            img.thumbnail((w * max_size / h, max_size))
        result = cStringIO.StringIO()
        img.save(result, 'JPEG', quality=70)
        result.seek(0)
        return result, img.size

    @staticmethod
    def get_new_image(url):
        try:
            f = cStringIO.StringIO(urllib2.urlopen(url).read())
            img = Image.open(f)

            img.thumbnail((current_app.config['EXPORT_GROUP_SIZE'], current_app.config['EXPORT_GROUP_SIZE']))
            high_pic = img.tostring('raw', 'RGB')

            img.thumbnail((current_app.config['GROUP_SIZE'], current_app.config['GROUP_SIZE']))
            low_pic = img.tostring('raw', 'RGB')

            return high_pic, low_pic
        except urllib2.HTTPError:
            return None

    @staticmethod
    def compile_image(picture):
        file_name = picture.export_full_path()

        if picture.export_generated == None or picture.export_generated < picture.updated:
            export_size = current_app.config['EXPORT_GROUP_SIZE']
            group_size = current_app.config['GROUP_SIZE']
            width = picture.width * export_size / group_size
            height = picture.height * export_size / group_size

            img = Image.new('RGBA', (width, height))
            for f in picture.fragments:
                if f.x != None and f.y != None:
                    fimg = Image.fromstring('RGB', (export_size, export_size), f.high_pic, 'raw')
                    img.paste(fimg, (f.x * export_size, f.y * export_size))

            print file_name
            img.save(os.path.join('web', file_name), 'PNG')
            picture.export_generated = datetime.datetime.now()
            picture.save()

        return file_name
        