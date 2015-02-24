from flask import Flask, render_template, request, redirect, url_for, current_app, session, jsonify
from flask import make_response
from flask.ext.scss import Scss
from .db.engine import init_db, get_db
#from .env_settings import load_env
import json
import peewee
from instagram import client
from .db.models import *
from picprocess.image_helper import ImageHelper
from picprocess.pixels import Pixels
import base64, urllib2


app = Flask(__name__, instance_relative_config=True)
app.config.from_object('web.default_settings')
#load_env(app)
app.config.from_pyfile('application.cfg', silent=True)

Scss(app)

init_db(app)


def get_unauthenticated_api(**kwargs):
    return client.InstagramAPI(client_id=current_app.config['INSTA_ID'],
                               client_secret=current_app.config['INSTA_SECRET'],
                               redirect_uri=url_for('insta_code', _external=True, **kwargs))


@app.route('/login')
def login():
    return redirect(get_unauthenticated_api().get_authorize_url())


@app.route('/logout')
def logout():
    if 'access_token' in session:
        del session['access_token']
    return redirect(get_unauthenticated_api().get_authorize_url())


@app.route('/insta_code')
def insta_code():
    code = request.args.get('code')
    try:
        access_token, user_info = get_unauthenticated_api().exchange_code_for_access_token(code)
        session['access_token'] = access_token

        try:
            user = User.get(User.insta_id == user_info[u'id'])
            if user.insta_name != user_info[u'username']:
                user.insta_name = user_info[u'username']
                user.save()
        except User.DoesNotExist:
            user = User.create(insta_id=user_info[u'id'], insta_name=user_info[u'username'])

        return redirect(url_for('render', id=1))
    except Exception as e:
        print e
        return 'error'


@app.route('/<id>')
def index(id):
    picture = Picture.get(Picture.id == id)
    fragments = [f.to_hash() for f in picture.fragments]

    return render_template('index.html', palette=json.dumps(fragments))


@app.route('/render/<id>')
def render(id):
    if 'access_token' not in session:
        return redirect(url_for('login'))

    picture = Picture.get(Picture.id == id)
    pixels = Pixels()
    pixels.get_pixels_from_img(picture)
    #fragments = [f.to_hash() for f in picture.fragments]

    return render_template('render.html', access_token=session['access_token'],
        picture=json.dumps(pixels.to_hash()))


@app.route('/resize')
def resize():
    if 'access_token' not in session:
        return 'error', 500
    
    url = request.args.get('url')
    colors = ImageHelper.get_image_color(request.args.get('url'), 4)
    return jsonify(colors=colors)


@app.route('/img')
def img():
    #if 'access_token' not in session:
    #    return 'error', 500
    
    url = request.args.get('url')
    f = urllib2.urlopen(url).read()
    response = make_response(f)
    response.headers['Content-Type'] = 'image/jpeg'
    return response


if __name__ == '__main__':
    app.run()