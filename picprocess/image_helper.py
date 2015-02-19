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
        img.thumbnail((size, size))
        return reduce(lambda a, b: a + b, img.getdata(), ())


    @staticmethod
    def add_color_to_media(m, size):
        return {
            'media': m,
            'colors': ImageHelper.get_web_image_color(m.get_thumbnail_url(), size)
        }