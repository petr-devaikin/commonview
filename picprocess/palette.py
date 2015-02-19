from .pixels import Pixels
from web.db.models import *
from instagram import client
from .image_helper import ImageHelper
import datetime

class PixelGroup:
    def __init__(self, x, y, size):
        self.x = x
        self.y = y
        self.size = size
        self.pixels = [0] * (size * size * 3)
        self.image = None
        self.diff = 255

    def calc_diff(self, media):
        summa = sum([abs(a - b) for a, b in zip(self.pixels, media['colors'])])
        return float(summa) / len(self.pixels)

    def add_pixel(self, dX, dY, color):
        self.pixels[3 * (dY * self.size + dX)] = color[0]
        self.pixels[3 * (dY * self.size + dX) + 1] = color[1]
        self.pixels[3 * (dY * self.size + dX) + 2] = color[2]


class Palette:
    PIX_PER_IMAGE = 4
    
    def __init__(self, picture):
        self.picture = picture
        self.pixels = Pixels()
        self.pixels.load_from_db(picture)

    def generate(self):
        palette = []
        for p in self.pixels.pixels:
            x = p['x'] / self.PIX_PER_IMAGE
            y = p['y'] / self.PIX_PER_IMAGE

            pixel_group = filter(lambda g: g.x == x and g.y == y, palette)
            if not pixel_group:
                pixel_group = PixelGroup(x, y, self.PIX_PER_IMAGE)
                palette.append(pixel_group)
            else:
                pixel_group = pixel_group[0]

            pixel_group.add_pixel(p['x'] % self.PIX_PER_IMAGE, p['y'] % self.PIX_PER_IMAGE, p['color'])

        self.palette = palette


    def save_to_db(self):
        ids_to_delete = [f.id for f in self.picture.fragments]
        Fragment.delete().where(Fragment.id << ids_to_delete).execute()

        for f in self.palette:
            insta_id = None
            insta_img = None
            insta_url = None
            insta_user = None
            if f.image:
                insta_id = f.image['media'].id
                insta_img = f.image['media'].get_thumbnail_url()
                insta_url = f.image['media'].link
                insta_user = f.image['media'].user.username

            Fragment.create(picture=self.picture, row=f.y, column=f.x,
                insta_id=insta_id, insta_img=insta_img, insta_url=insta_url, insta_user=insta_user)

        self.picture.updated = datetime.date.today()
        self.picture.save()


    def fill(self, config, tag):
        insta = client.InstagramAPI(client_id=config['INSTA_ID'], client_secret=config['INSTA_SECRET'])

        params = {
            'count': config['INSTA_REQUEST_PHOTO_COUNT'],
            'tag_name': tag,
        }

        threshold = config['MATCH_THRESHOLD']

        counter = 0
        global_diff = 255
        diff_delta = 255

        while diff_delta > threshold and counter < config['MAX_ITERATIONS']:
            print 'Start step'

            counter += 1
            media, next_ = insta.tag_recent_media(**params)

            print 'Insta done'

            currently_found = 0
            free_media = [ImageHelper.add_color_to_media(m, self.PIX_PER_IMAGE) for m in media]
            i = 0

            print 'Resized'

            while i < len(free_media):
                first_fixed = True
                current_media = free_media[i]
                if current_media['colors'] == None:
                    free_media.remove(current_media)
                    continue
                i += 1
                for f in self.palette:
                    diff = f.calc_diff(current_media)
                    if f.image == None or f.diff > diff:
                        if f.image != None:
                            free_media.append(f.image)
                        f.image = current_media
                        f.diff = diff
                        currently_found += 1
                        break

            new_global_diff = sum([f.diff for f in self.palette]) / float(len(self.palette))
            diff_delta = global_diff - new_global_diff
            global_diff = new_global_diff

            print 'Currently found: %d' % currently_found
            print 'Global diff: ' + str(global_diff)

            params['with_next_url'] = next_