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

    empty_pixels = palette[:]

    params = {
        'count': 100,
        'tag_name': 'moscow',
    }

    counter = 0
    threshold = 15
    while empty_pixels and counter < app.config['MAX_ITERATIONS']:        
        print len(empty_pixels)
        print threshold
        counter += 1
        media, next_ = insta.tag_recent_media(**params)

        currently_found = 0
        for m in media:
            url = m.get_thumbnail_url()
            f = cStringIO.StringIO(urllib.urlopen(url).read())
            img = Image.open(f).resize((1, 1), Image.ANTIALIAS)
            img_color = img.getpixel((0, 0))
            for p in empty_pixels:
                if p['image'] == None and max([abs(p['color'][i] - img_color[i]) for i in range(3)]) < threshold:
                    p['image'] = {
                        'url': url
                    }
                    empty_pixels.remove(p)
                    currently_found += 1
                    #break

        if currently_found < 10:
            threshold *= 2

        params['with_next_url'] = next_

    return render_template('index.html', palette=json.dumps(palette))


if __name__ == '__main__':
    app.run()