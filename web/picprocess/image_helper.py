from PIL import Image, ImageCms
import cStringIO
from flask import current_app
import urllib2
import requests


class ImageHelper:
    # Resizes image if its width or height is bigger than max_size. Returns image, stream, and its size
    @staticmethod
    def resize(f, max_size):
        img = Image.open(f)
        w, h = img.size
        if w >= h and w > max_size:
            new_w = max_size
            new_h = h * max_size / w
        elif h >= w and h > max_size:
            new_w = w * max_size / h
            new_h = max_size


        img.thumbnail((new_w, new_h))

        crop_w = (new_w / current_app.config['GROUP_SIZE']) * current_app.config['GROUP_SIZE']
        crop_h = (new_h / current_app.config['GROUP_SIZE']) * current_app.config['GROUP_SIZE']

        img.crop((
            (new_w - crop_w / 2),
            (new_h - crop_h / 2),
            (new_w - crop_w / 2) + crop_w,
            (new_h - crop_h / 2) + crop_h
        ))

        result = cStringIO.StringIO()
        img.save(result, 'JPEG', quality=70)
        result.seek(0)
        return img, result, img.size


    # Returns a fragment of picture (byte array)
    @staticmethod
    def getFragment(img, x, y, w, h):
        return img.crop((x, y, x+w, y+h)).tobytes('raw', 'RGB')


    # Downloads a picture from url, resizes it to high- and low-res and returns 2 byte arrays (RGB)
    @staticmethod
    def get_image(url):
        try:
            f = cStringIO.StringIO(urllib2.urlopen(url).read())
            img_o = Image.open(f).convert('RGB')

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
            high_pic = img.tobytes()

            img.thumbnail((current_app.config['GROUP_SIZE'], current_app.config['GROUP_SIZE']))
            low_pic = img.tobytes()

            return high_pic, low_pic
        except urllib2.HTTPError:
            return None


    # Compiles export image file for picture. Returns image stream
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
