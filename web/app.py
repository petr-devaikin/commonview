from flask import Flask, render_template, request, redirect, url_for, current_app, session, jsonify, g, send_file
from flask.ext.mobility import Mobility
import json
from instagram import client
from httplib2 import Http
from .picprocess.image_helper import ImageHelper
from .picprocess.pixels import Pixels
from .picprocess.palette import Palette
from .picprocess.lobster_proxy import LobsterProxy
import os
from flask.ext.scss import Scss
from .db.engine import init_db, get_db
from .db.models import *
import cStringIO
import re
from .logger import get_logger, set_logger_params
import random
import requests


app = Flask(__name__, instance_relative_config=True)
app.config.from_object('web.default_settings')
app.config.from_pyfile('application.cfg', silent=True)

Scss(app)
Mobility(app)

set_logger_params(app)
init_db(app)


@app.before_request
def before_request():
    db = get_db()
    db.connect()

    '''
    if 'user_id' in session:
        g.authorized = True
        # load from db if not /img or /resize
        g.user = User.get(User.id == session['user_id'])
    else:
        g.authorized = False
        g.user = None
    '''


@app.after_request
def after_request(response):
    get_db().close()
    return response


@app.route('/')
def index():
    #if g.authorized:
    can_upload = True   #g.user.id == current_app.config['MY_ID'] or \
                        #g.user.pictures.count() < current_app.config['MAX_UPLOADS']
    return render_template('pictures.html',
        pictures=Picture.select(),
        can_upload=can_upload,
        max_count=current_app.config['MAX_UPLOADS'],
        max_size=current_app.config['MAX_CONTENT_LENGTH'])
    '''else:
        pics = Picture.select().where(Picture.global_diff < current_app.config['GALLERY_MAX_DIFF'])
        numbers = range(pics.count())
        random.shuffle(numbers)
        gallery = [pics[i] for i in numbers[:3]]
        return render_template('index.html', gallery=gallery)'''


# get or remove palette
@app.route('/pic/<id>', methods=['GET', 'DELETE'])
def render(id):
    try:
        picture = Picture.get(Picture.id==id)
    except Picture.DoesNotExist:
        return 'Not found', 404


    if request.method == 'GET':
        if request.MOBILE:
            return render_template('mobile/showpicture.html',
                    picture=picture,
                    diff=picture.global_diff
                )
            '''elif not g.authorized or picture.user.id != g.user.id:
                pixels.get_empty_pixels(picture)

                return render_template('showpicture.html',
                        picture=picture,
                        pixels=json.dumps(pixels.to_hash()),
                        palette=json.dumps(Palette.load_from_db(picture)),
                    )'''
        else:
            return render_template('render.html',
                    picture=picture,
                    fragments=json.dumps([f.to_hash() for f in picture.fragments]),
                    diff=picture.global_diff
                )
    else:
        #if not g.authorized or picture.user.id != g.user.id:
        #    return 'error', 500

        get_logger().info('User removed picture %d', picture.id)

        Palette.remove_from_db(picture)
        return jsonify(result='ok')


# picture uploaded by user (jpeg)
@app.route('/pic/<id>/preview')
def preview(id):
    try:
        picture = Picture.get(Picture.id==id)
    except Picture.DoesNotExist:
        return 'Not found', 404

    #if not g.authorized or picture.belong_to_user(g.user):
    #    return 'error', 500

    return send_file(cStringIO.StringIO(picture.image), mimetype='image/jpeg')


# large compiled result
@app.route('/pic/<id>/export')
def export(id):
    try:
        picture = Picture.get(Picture.id==id)
    except Picture.DoesNotExist:
        return 'Not found', 404

    result = ImageHelper.compile_image(picture)
    return send_file(result, mimetype='image/png')


# update palette
@app.route('/palette/<id>', methods=['POST'])
def palette(id):
    try:
        picture = Picture.get(Picture.id==id)
    except Picture.DoesNotExist:
        return 'Not found', 404

    #if not g.authorized or not picture.belong_to_user(g.user):
    #    return 'error', 500

    get_logger().debug('Save palette %d', picture.id)

    if Palette.save_to_db(picture, request.form['palette']):
        return jsonify(result='ok')
    else:
        return jsonify(error='wrong data'), 500


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in current_app.config['ALLOWED_EXTENSIONS']


@app.route('/upload', methods=['POST'])
def upload():
    #if not g.authorized or \
    #      (g.user.pictures.count() >= current_app.config['MAX_UPLOADS'] and g.user.id != current_app.config['MY_ID']):
    #    return 'error', 500

    f = request.files['pic']
    if f and allowed_file(f.filename):
        with get_db().atomic() as txn:
            pic, size = ImageHelper.resize(f, current_app.config['IMAGE_WIDTH'])
            picture = Picture.create(
                #user=g.user,
                width=size[0],
                height=size[1],
                image=pic.getvalue()
            )

            for i in xrange(picture.fragment_width()):
                for j in xrange(picture.fragment_height()):
                    # MAKE IT MUCH FASTER!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                    source_pic = ImageHelper.getFragment(
                        picture.image,
                        i * current_app.config['GROUP_SIZE'],
                        j * current_app.config['GROUP_SIZE'],
                        current_app.config['GROUP_SIZE'],
                        current_app.config['GROUP_SIZE']);

                    f = Fragment.create(
                        picture=picture,
                        x=i,
                        y=j,
                        source_pic=source_pic
                    )

        get_logger().info('User uploaded picture %d', picture.id)
        return jsonify(result='ok', url=url_for('render', _external=True, id=picture.id))
    else:
        return jsonify(result='error'), 500


@app.route('/palette/<id>/update')
def update(id):
    try:
        picture = Picture.get(Picture.id==id)
    except Picture.DoesNotExist:
        return 'Not found', 404

    #if not g.authorized or not picture.belong_to_user(g.user): return 'error', 500

    get_logger().debug('Getting new images for %d', picture.id)

    images = LobsterProxy.get_images(picture.page)
    if images == None:
        return 'requesting content error', 500
    elif len(images) == 0:
        picture.page = None
        picture.save()
        return jsonify(result='done')
    else:
        updated_fragments = Palette.find_place(picture, images)
        if updated_fragments == None:
            return 'requesting content error', 500
        picture.page += 1
        picture.save()
        return jsonify(result='processing', fragments=[u.to_hash() for u in updated_fragments])



if __name__ == '__main__':
    app.run()
