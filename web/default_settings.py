DEBUG = False
VERSION = '1.0.0.1'

SECRET_KEY = '!\x11\xebG\x12\xe8\xb4\xedF.\x06:g6\x8e\x9e\xcd\xc4k\x94L\xb4)\xa3'
DATABASE_URI = 'sqlite:////tmp/commonview.db'
  
INSTA_ID = ''
INSTA_SECRET = ''

MAX_UPLOADS = 4
MY_ID = 1

ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png']
MAX_CONTENT_LENGTH = 5 * 1024 * 1024

IMAGE_WIDTH = 300
GROUP_SIZE = 5
EXPORT_GROUP_SIZE = 20


SEND_FILE_MAX_AGE_DEFAULT = 0
ALLOWED_INSTA_URL = '^[a-zA-Z0-9_-]+$'
MAX_CACHED_PHOTOS = 40


LOGGER = {
    'FORMAT': '[%(asctime)s] %(filename)s[%(lineno)d] #%(levelname)-8s  %(message)s',
    'PATH': 'pazzla.log',
    'DEBUG_PATH': 'pazzla-debug.log'
}