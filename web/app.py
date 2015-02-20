from flask import Flask, render_template, request, jsonify, redirect, url_for
from flask.ext.scss import Scss
from .db.engine import init_db, get_db
#from .env_settings import load_env
import json
import peewee

from .db.models import *


app = Flask(__name__, instance_relative_config=True)
app.config.from_object('web.default_settings')
#load_env(app)
app.config.from_pyfile('application.cfg', silent=True)

Scss(app)

init_db(app)

@app.route('/')
def index():
    picture = Picture.get(Picture.id == 1)
    fragments = [f.to_hash() for f in picture.fragments]

    return render_template('index.html', palette=json.dumps(fragments))


if __name__ == '__main__':
    app.run()