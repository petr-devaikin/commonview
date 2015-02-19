from .pixels import Pixels
from web.db.models import *
from instagram import client
from .image_helper import ImageHelper
import datetime
import threading
import Queue

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


class Downloader(threading.Thread):
    def __init__(self, queue, count, tag, insta_id, insta_secret, group_size):
        super(Downloader, self).__init__()
        self.queue = queue
        self.count = count
        self.tag = tag
        self.insta = client.InstagramAPI(client_id=insta_id, client_secret=insta_secret)
        self.group_size = group_size

        self._start_download = threading.Event()
        self._downloaded = threading.Event()
        self._stop = threading.Event()


    def stop(self):
        self._stop.set()

    def stopped(self):
        return self._stop.isSet()

    def start_download(self):
        self._start_download.set()
        if not self.stopped():
            self._downloaded.wait()
            self._downloaded.clear()


    def run(self):   
        params = {
            'count': self.count,
            'tag_name': self.tag,
        }

        while not self.stopped():
            while self.queue.qsize() < 100 and not self.stopped():
                media, next_ = self.insta.tag_recent_media(**params)
                print("%d downloaded" % len(media))
                for m in media:
                    self.queue.put(ImageHelper.add_color_to_media(m, self.group_size))
                print("%d resized" % len(media))
                self._downloaded.set()
                params['with_next_url'] = next_

            self._start_download.wait()
            self._start_download.clear()



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
        q = Queue.Queue()

        downloader = Downloader(q, config['INSTA_REQUEST_PHOTO_COUNT'], tag,
            config['INSTA_ID'], config['INSTA_SECRET'], self.PIX_PER_IMAGE)
        downloader.start()

        threshold = config['MATCH_THRESHOLD']

        counter = 0
        global_diff = 255
        diff_delta = 255

        while global_diff > threshold and counter < config['MAX_ITERATIONS']:
            try:
                m = q.get_nowait()
            except Queue.Empty:
                print 'Wait for media'
                downloader.start_download()
                continue

            counter += 1

            currently_found = 0
            free_media = [m]
            i = 0

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

        downloader.stop()
        downloader.start_download()

