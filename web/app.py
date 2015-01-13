from flask import Flask, render_template, request, jsonify, redirect, url_for
from flask.ext.scss import Scss
#from .db.engine import init_db, get_db
#from .env_settings import load_env
import json
import peewee
import random


app = Flask(__name__, instance_relative_config=True)
app.config.from_object('web.default_settings')
#load_env(app)
app.config.from_pyfile('application.cfg', silent=True)

Scss(app)

#init_db(app)


@app.route('/')
def index():
    palette = []
    for i in range(20):
        for j in range(15):
            palette.append({
                'x': i,
                'y': j,
                'color': 'rgb(%d,%d,%d)' % (random.randrange(255), random.randrange(255), random.randrange(255))
            })

    return render_template('index.html', palette=palette)


if __name__ == '__main__':
    app.run()