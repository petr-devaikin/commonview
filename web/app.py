from flask import Flask, render_template, request, redirect, url_for, current_app, session, jsonify
from flask import make_response, g
from flask.ext.scss import Scss
from .db.engine import init_db, get_db
import json
import peewee
from instagram import client
from .db.models import *
from picprocess.image_helper import ImageHelper
from picprocess.pixels import Pixels
import urllib2
import os


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


@app.before_request
def before_request():
    if 'user_id' in session:
        g.authorized = True
        # load from db if not /img or /resize
        g.user = User.get(User.id == session['user_id'])
    else:
        g.authorized = False
        g.user = None


@app.route('/login')
def login():
    return redirect(get_unauthenticated_api().get_authorize_url())


@app.route('/logout')
def logout():
    if g.authorized:
        del session['user_id']
    return redirect(url_for('index'))


@app.route('/insta_code')
def insta_code():
    code = request.args.get('code')
    try:
        access_token, user_info = get_unauthenticated_api().exchange_code_for_access_token(code)

        try:
            user = User.get(User.insta_id == user_info[u'id'])
            if user.insta_name != user_info[u'username']: user.insta_name = user_info[u'username']
            if user.access_token != access_token: user.access_token = access_token
            user.save()
        except User.DoesNotExist:
            user = User.create(insta_id=user_info[u'id'],
                               insta_name=user_info[u'username'],
                               access_token=access_token)

        session['user_id'] = user.id

        return redirect(url_for('index'))
    except Exception as e:
        print e
        return 'error'


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/render/<id>')
def render(id):
    if not g.authorized: return redirect(url_for('index'))

    #check picture owner

    picture = Picture.get(Picture.id == id)
    pixels = Pixels()
    pixels.get_pixels_from_img(picture)
    #fragments = [f.to_hash() for f in picture.fragments]

    return render_template('render.html', access_token=g.user.access_token,
        picture=json.dumps(pixels.to_hash()))


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1] in current_app.config['ALLOWED_EXTENSIONS']


@app.route('/upload', methods=['GET', 'POST'])
def upload():
    if not g.authorized: return redirect(url_for('index'))

    if request.method == 'POST':
        f = request.files['pic']
        if f and allowed_file(f.filename):
            picture = Picture.create(user=g.user)
            pic = ImageHelper.resize(f)
            pic.save(picture.get_full_path())
            return jsonify(result='ok', url=url_for('render', _external=True, id=picture.id))
        else:
            return jsonify(result='error'), 500
    else:
        return render_template('upload.html')


@app.route('/img')
def img():
    if not g.authorized: return 'error', 500
    
    url = request.args.get('url')
    try:
        f = urllib2.urlopen(url).read()
    except urllib2.HTTPError:
        return 'Not found', 404
    response = make_response(f)
    response.headers['Content-Type'] = 'image/jpeg'
    return response


if __name__ == '__main__':
    app.run()