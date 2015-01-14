from flask import Flask, render_template, request, jsonify, redirect, url_for
from flask.ext.scss import Scss
#from .db.engine import init_db, get_db
#from .env_settings import load_env
import json
import peewee
import random
from PIL import Image


app = Flask(__name__, instance_relative_config=True)
app.config.from_object('web.default_settings')
#load_env(app)
app.config.from_pyfile('application.cfg', silent=True)

Scss(app)

#init_db(app)


@app.route('/')
def index():
    width = 80
    height = 60

    img = Image.open('web/static/img/basil.jpeg')
    small_img = img.resize((width, height), Image.ANTIALIAS)

    palette = []
    for i in range(width):
        for j in range(height):
            pixel = small_img.getpixel((i, j))
            print pixel
            palette.append({
                'x': i,
                'y': j,
                'color': 'rgb(%d,%d,%d)' % pixel
            })

    return render_template('index.html', palette=json.dumps(palette))


if __name__ == '__main__':
    app.run()