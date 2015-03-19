from os import environ

def load_env(app):
    if 'DATABASE_URI' in environ: app.config['DATABASE_URI'] = environ.get('DATABASE_URI')

    if 'INSTA_ID' in environ: app.config['INSTA_ID'] = int(environ.get('INSTA_ID'))
    if 'INSTA_SECRET' in environ: app.config['INSTA_SECRET'] = environ.get('INSTA_SECRET')