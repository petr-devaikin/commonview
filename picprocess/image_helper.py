import urllib2, cStringIO
from PIL import Image

class ImageHelper:
    @staticmethod
    def get_web_image_color(url, size):
        try:
            f = cStringIO.StringIO(urllib2.urlopen(url).read())
        except urllib2.HTTPError:
            return None

        img = Image.open(f)
        colour_tuple = [None, None, None]
        return img.resize((size, size), Image.ANTIALIAS)


    @staticmethod
    def add_color_to_media(m, size):
        return {
            'media': m,
            'small_pic': ImageHelper.get_web_image_color(m.get_thumbnail_url(), size)
        }