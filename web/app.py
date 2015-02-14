from flask import Flask, render_template, request, jsonify, redirect, url_for
from flask.ext.scss import Scss
from .db.engine import init_db, get_db
#from .env_settings import load_env
import json
import peewee
import random
from PIL import Image
import urllib2, cStringIO
from instagram import client


app = Flask(__name__, instance_relative_config=True)
app.config.from_object('web.default_settings')
#load_env(app)
app.config.from_pyfile('application.cfg', silent=True)

Scss(app)

init_db(app)

@app.route('/')
def index():
    return render_template('index.html', palette=json.dumps(palette))


if __name__ == '__main__':
    app.run()