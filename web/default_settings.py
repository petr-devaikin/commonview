DEBUG = False
VERSION = '2.0.0'

SECRET_KEY = '!\x11\xebG\x12\xe8\xb4\xedF.\x06:g6\x8e\x9e\xcd\xc4k\x94L\xb4)\xa3'
DATABASE_URI = 'sqlite:////tmp/commonview.db'

LOBSTER_CONTENT_URL = 'https://lobster.media/dev/api/v1/contents'
LOBSTER_IMAGE_URL = 'http://lobster.media/content/'
LOBSTER_SECRET = ''
LOAD_PAGE_SIZE = 3

MAX_UPLOADS = 4
MY_ID = 1

ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png']
MAX_CONTENT_LENGTH = 5 * 1024 * 1024

IMAGE_WIDTH = 300
GROUP_SIZE = 5
EXPORT_GROUP_SIZE = 20


SEND_FILE_MAX_AGE_DEFAULT = 0


GALLERY_MAX_DIFF = 80


LOGGER = {
    'FORMAT': '[%(asctime)s] %(filename)s[%(lineno)d] #%(levelname)-8s  %(message)s',
    'PATH': 'mosaic.log',
    'DEBUG_PATH': 'mosaic-debug.log'
}
