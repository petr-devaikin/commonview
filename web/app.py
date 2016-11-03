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
            pixels = Pixels()
            pixels.get_pixels_from_img(picture)
            return render_template('render.html',
                    picture=picture,
                    pixels=json.dumps(pixels.to_hash()),
                    fragments=json.dumps([f.to_hash() for f in picture.fragments.where(Fragment.x != None)]),
                    diff=picture.global_diff
                )
    else:
        #if not g.authorized or picture.user.id != g.user.id:
        #    return 'error', 500

        get_logger().info('User removed picture %d', picture.id)

        with get_db().atomic() as txn:
            Fragment.delete().where(Fragment.picture == picture).execute()
            picture.delete_instance()

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
            img, stream, size = ImageHelper.resize(f, current_app.config['IMAGE_WIDTH'])
            picture = Picture.create(
                #user=g.user,
                width=size[0],
                height=size[1],
                image=stream.getvalue()
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

    # remove old unused fragments (just in case user interrupted saving)
    Fragment.delete().where(Fragment.picture == picture, Fragment.x == None).execute()

    get_logger().debug('Getting new images for %d', picture.id)

    images = LobsterProxy.get_images(picture.page)

    if images == None:
        return 'Requesting content error', 500
    elif len(images) == 0:
        picture.page = None
        picture.save()
        return jsonify(result='done')
    else:
        fragments = []
        for i in images:
            if i['thumb'] != None: # wtf
                img_res = ImageHelper.get_image(i['thumb'])
                if img_res != None:
                    f = Fragment.create(
                        picture=picture,
                        lobster_id=i['_id'],
                        lobster_img=i['thumb'],
                        lobster_url=current_app.config['LOBSTER_IMAGE_URL'] + i['_id'],
                        low_pic=img_res[1],
                        high_pic=img_res[0]
                    )
                    fragments.append(f)
        picture.page += 1
        picture.save()

        return jsonify(result='processing', fragments=[f.to_hash() for f in fragments])


@app.route('/palette/<id>/save', methods=['POST'])
def save(id):
    try:
        picture = Picture.get(Picture.id==id)
    except Picture.DoesNotExist:
        return 'Not found', 404

    #if not g.authorized or not picture.belong_to_user(g.user): return 'error', 500

    form_data = json.loads(request.form['data'])

    updated_fragments = form_data['updatedGroups']
    for f in updated_fragments:
        upd = Fragment.update(x=f['x'], y=f['y'], diff=f['diff'])
        upd = upd.where(Fragment.id == f['id'], Fragment.picture == picture)
        upd.execute()

    Fragment.delete().where(Fragment.picture == picture, Fragment.id << form_data['removedPicrures']).execute()
    Fragment.delete().where(Fragment.picture == picture, Fragment.x == None).execute()

    fragments_count_diff = picture.fragments.count() - picture.fragment_width() * picture.fragment_height()
    if fragments_count_diff > 0:
        get_logger().error('Wrong fragment combination for %d', picture.id)
        to_delete = picture.fragments.limit(fragments_count_diff)
        dlt = Fragment.delete().where(Fragment.id << [f.id for d in to_delete])
        dlt.execute()
        return jsonify(result='error'), 500
    else:
        return jsonify(result='done')


if __name__ == '__main__':
    app.run()
