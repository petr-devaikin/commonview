from flask import Flask, render_template, request, redirect, url_for, current_app, session
from flask.ext.scss import Scss
from .db.engine import init_db, get_db
#from .env_settings import load_env
import json
import peewee
from instagram import client
from .db.models import *


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

        return redirect(url_for('index', id=1))
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
    #picture = Picture.get(Picture.id == id)
    #fragments = [f.to_hash() for f in picture.fragments]

    return render_template('render.html', access_token=session['access_token'])


if __name__ == '__main__':
    app.run()