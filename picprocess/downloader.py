from .image_helper import ImageHelper
from instagram import client
import threading


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
            while self.queue.qsize() < 200 and not self.stopped():
                media, next_ = self.insta.tag_recent_media(**params)
                print("%d downloaded" % len(media))
                for m in media:
                    self.queue.put(ImageHelper.download_img(m))
                    self._downloaded.set()
                print("%d img downloaded" % len(media))
                params['with_next_url'] = next_

            self._start_download.wait()
            self._start_download.clear()