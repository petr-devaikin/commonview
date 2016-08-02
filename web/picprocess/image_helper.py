from PIL import Image
import cStringIO
from flask import current_app
import urllib2

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
            img_o = Image.open(f)

            w, h = img_o.size
            if w == h:
                img = img_o
            elif w > h:
                left = (w - h) / 2
                right = left + h
                img = img_o.crop(box=(left, 0, right, h))
            else:
                top = (h - w) / 2
                bottom = top + w
                img = img_o.crop(box=(0, top, w, bottom))

            img.thumbnail((current_app.config['EXPORT_GROUP_SIZE'], current_app.config['EXPORT_GROUP_SIZE']))
            high_pic = img.tobytes('raw', 'RGB')

            img.thumbnail((current_app.config['GROUP_SIZE'], current_app.config['GROUP_SIZE']))
            low_pic = img.tobytes('raw', 'RGB')

            return high_pic, low_pic
        except urllib2.HTTPError:
            return None

    @staticmethod
    def compile_image(picture):
        export_size = current_app.config['EXPORT_GROUP_SIZE']
        group_size = current_app.config['GROUP_SIZE']
        width = picture.width * export_size / group_size
        height = picture.height * export_size / group_size

        img = Image.new('RGBA', (width, height))
        for f in picture.fragments:
            if f.x != None and f.y != None:
                fimg = Image.frombytes('RGB', (export_size, export_size), f.high_pic, 'raw')
                img.paste(fimg, (f.x * export_size, f.y * export_size))

        img_io = cStringIO.StringIO()
        img.save(img_io, 'PNG', quality=70)
        img_io.seek(0)

        return img_io
