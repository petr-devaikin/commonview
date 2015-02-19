from .pixels import Pixels
from web.db.models import *
from instagram import client
from .image_helper import ImageHelper
import datetime

class PixelGroup:
    def __init__(self, x, y):
        self.x = x
        self.y = y
        self.pixels = []
        self.image = None
        self.diff = 255

    def calc_diff(self, media, size):
        summa = 0
        for p in self.pixels:
            media_colors = media['small_pic'].getpixel((p['dX'], p['dY']))
            summa += max([abs(a - b) for a, b in zip(p['color'], media_colors)])
        return float(summa) / len(self.pixels)


class Palette:
    PIX_PER_IMAGE = 3
    
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
                pixel_group = PixelGroup(x, y)
                palette.append(pixel_group)
            else:
                pixel_group = pixel_group[0]

            pixel_group.pixels.append({
                'dX': p['x'] % self.PIX_PER_IMAGE,
                'dY': p['y'] % self.PIX_PER_IMAGE,
                'color': p['color']
            })

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
            counter += 1
            media, next_ = insta.tag_recent_media(**params)

            currently_found = 0
            free_media = [ImageHelper.add_color_to_media(m, self.PIX_PER_IMAGE) for m in media]
            free_media = [m for m in free_media if m['small_pic']]
            i = 0

            print len(free_media)

            while i < len(free_media):
                first_fixed = True
                current_media = free_media[i]
                i += 1
                for f in self.palette:
                    diff = f.calc_diff(current_media, self.PIX_PER_IMAGE)
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