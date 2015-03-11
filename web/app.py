from flask import Flask, render_template, request, redirect, url_for, current_app, session, jsonify
from flask import make_response, g, Response, send_file
from flask.ext.scss import Scss
from .db.engine import init_db
import json
import peewee
from instagram import client
from .db.models import *
from picprocess.image_helper import ImageHelper
from picprocess.pixels import Pixels
from picprocess.palette import Palette
import os
import urllib2


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
    can_upload = g.authorized and g.user.pictures.count() < current_app.config['MAX_UPLOADS'] 
    return render_template('index.html', can_upload=can_upload,
        max_size=current_app.config['MAXIMUM_SIZE'])


@app.route('/pic/<id>')
def render(id):
    picture = Picture.get(Picture.id == id)
    pixels = Pixels()
    pixels.get_pixels_from_img(picture)

    if not g.authorized or picture.user.id != g.user.id:
        return render_template('render.html',
                picture=picture,
                pixels=json.dumps(pixels.to_hash())
            )
    else:

        return render_template('render.html',
                picture=picture,
                pixels=json.dumps(pixels.to_hash()),
                access_token=g.user.access_token
            )


@app.route('/pic/<id>/preview')
def preview(id):
    try:
        picture = Picture.get(Picture.id==id)
    except Picture.NotFound:
        return 'Not found', 404

    return send_file('../' + picture.get_full_path())


@app.route('/palette/<id>', methods=['GET', 'POST', 'DELETE'])
def palette(id):
    try:
        picture = Picture.get(Picture.id==id)
    except Picture.NotFound:
        return 'Not found', 404

    if request.method == 'GET':
        data = Palette.load_from_db(picture)
        return jsonify(**data)
    elif not g.authorized:
        return 'error', 500
    elif picture.user.id != g.user.id:
        return 'error', 500
    else:
        if request.method == 'POST':
            Palette.save_to_db(picture, request.form['palette'])
            return jsonify(result='ok')
        else: #request.method == 'DELETE':
            os.remove(picture.get_full_path())
            Palette.remove_from_db(picture)
            return jsonify(result='ok')


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in current_app.config['ALLOWED_EXTENSIONS']


@app.route('/upload', methods=['POST'])
def upload():
    if not g.authorized or g.user.pictures.count() >= current_app.config['MAX_UPLOADS']:
        return 'error', 500

    f = request.files['pic']
    if f and allowed_file(f.filename):
        picture = Picture.create(user=g.user)
        pic = ImageHelper.resize(f, current_app.config['IMAGE_WIDTH'])
        pic.save(picture.get_full_path())
        return jsonify(result='ok', url=url_for('render', _external=True, id=picture.id))
    else:
        return jsonify(result='error'), 500


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