from flask import Flask, render_template, request, jsonify, redirect, url_for
from flask.ext.scss import Scss
#from .db.engine import init_db, get_db
#from .env_settings import load_env
import json
import peewee
import random
from PIL import Image
import urllib, cStringIO
from instagram import client


app = Flask(__name__, instance_relative_config=True)
app.config.from_object('web.default_settings')
#load_env(app)
app.config.from_pyfile('application.cfg', silent=True)

Scss(app)

insta = client.InstagramAPI(client_id=app.config['INSTA_ID'], client_secret=app.config['INSTA_SECRET'])
#init_db(app)

def get_web_image_color(url):
    f = cStringIO.StringIO(urllib.urlopen(url).read())
    img = Image.open(f).resize((1, 1), Image.ANTIALIAS)
    return img.getpixel((0, 0))

@app.route('/')
def index():
    width = 40
    height = 30

    img = Image.open('web/static/img/basil.jpeg')
    small_img = img.resize((width, height), Image.ANTIALIAS)

    palette = []
    for i in range(width):
        for j in range(height):
            pixel = small_img.getpixel((i, j))
            palette.append({
                'x': i,
                'y': j,
                'color': pixel,
                'image': None,
            })

    params = {
        'count': 50,
        'tag_name': 'moscow',
    }

    counter = 0
    global_diff = 255
    while global_diff > 15 and counter < app.config['MAX_ITERATIONS']:
        counter += 1
        media, next_ = insta.tag_recent_media(**params)

        currently_found = 0
        for m in media:
            url = m.get_thumbnail_url()
            img_color = get_web_image_color(url)

            same_pixels = []
            for p in palette:
                diff = max([abs(a - b) for a, b in zip(p['color'], img_color)])
                if p['image'] == None or p['image']['diff'] > diff:
                    p['image'] = {
                        'url': url,
                        'diff': diff
                    }
                    currently_found += 1

        global_diff = sum([p['image']['diff'] for p in palette]) / len(palette)
        print 'Currently found: %d' % currently_found
        print 'Global diff: %d' % global_diff
        
        params['with_next_url'] = next_

    return render_template('index.html', palette=json.dumps(palette))


if __name__ == '__main__':
    app.run()