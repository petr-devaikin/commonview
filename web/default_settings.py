DEBUG = False

import os
SECRET_KEY = os.urandom(24)
  
INSTA_ID = ''
INSTA_SECRET = ''

INSTA_REQUEST_PHOTO_COUNT = 50

DATABASE_URI = 'sqlite:////tmp/commonview.db'

IMAGE_WIDTH = 200

MAX_ITERATIONS = 1000
MATCH_THRESHOLD = 27

MAX_UPLOADS = 3


ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif']
UPLOAD_FOLDER = 'img/'
