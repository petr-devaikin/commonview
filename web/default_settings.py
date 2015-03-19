DEBUG = True

SEND_FILE_MAX_AGE_DEFAULT = 0

SECRET_KEY = '!\x11\xebG\x12\xe8\xb4\xedF.\x06:g6\x8e\x9e\xcd\xc4k\x94L\xb4)\xa3'

import re
ALLOWED_INSTA_URL = re.compile('^[a-zA-Z0-9_-]+$')
  
INSTA_ID = ''
INSTA_SECRET = ''

DATABASE_URI = 'sqlite:////tmp/commonview.db'

IMAGE_WIDTH = 300
GROUP_SIZE = 5
EXPORT_GROUP_SIZE = 20
MAX_CACHED_PHOTOS = 40

MAX_ITERATIONS = 1000
MATCH_THRESHOLD = 27

MAX_UPLOADS = 4


ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png']
MAX_CONTENT_LENGTH = 5 * 1024 * 1024
UPLOAD_FOLDER = 'img/'
