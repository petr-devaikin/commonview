from flask import Flask, render_template, request, redirect, url_for, current_app, session, jsonify
from flask import make_response
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
        g.user = User.get(id == session['user_id'])
    else:
        g.authorized = False
        g.user = None


@app.route('/login')
def login():
    return redirect(get_unauthenticated_api().get_authorize_url())


@app.route('/logout')
def logout():
    if not g.authorized:
        del session['user_id']
    return redirect('index')


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
            user = User.create(insta_id=user_info[u'id'], insta_name=user_info[u'username'])

        session['user_id'] = user.id

        return redirect(url_for('render', id=1))
    except Exception as e:
        print e
        return 'error'


@app.route('/<id>')
def index(id=None):
    picture = Picture.get(Picture.id == id)
    fragments = [f.to_hash() for f in picture.fragments]

    return render_template('index.html', palette=json.dumps(fragments))


@app.route('/render/<id>')
def render(id):
    if not g.authorized: return redirect(url_for('index'))

    picture = Picture.get(Picture.id == id)
    pixels = Pixels()
    pixels.get_pixels_from_img(picture)
    #fragments = [f.to_hash() for f in picture.fragments]

    return render_template('render.html', access_token=session['access_token'],
        picture=json.dumps(pixels.to_hash()))


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1] in current_app.config['ALLOWED_EXTENSIONS']


@app.route('/upload', methods=['GET', 'POST'])
def upload():
    if not g.authorized: return redirect(url_for('index'))

    if request.method == 'POST':
        file = request.files['file']
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            file.save(os.path.join(current_app.config['UPLOAD_FOLDER'], filename))
            return redirect(url_for('uploaded_file', filename=filename))




@app.route('/resize')
def resize():
    if not g.authorized: return 'error', 500
    
    url = request.args.get('url')
    colors = ImageHelper.get_image_color(request.args.get('url'), 4)
    return jsonify(colors=colors)


@app.route('/img')
def img():
    if not g.authorized: return 'error', 500
    
    url = request.args.get('url')
    f = urllib2.urlopen(url).read()
    response = make_response(f)
    response.headers['Content-Type'] = 'image/jpeg'
    return response


if __name__ == '__main__':
    app.run()