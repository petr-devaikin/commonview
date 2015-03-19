from os import environ

def load_env(app):
    if 'DATABASE_URI' in environ: app.config['DATABASE_URI'] = environ.get('DATABASE_URI')

    if 'INSTA_ID' in environ: app.config['INSTA_ID'] = environ.get('INSTA_ID')
    if 'INSTA_SECRET' in environ: app.config['INSTA_SECRET'] = environ.get('INSTA_SECRET')
    
    if 'PREFERRED_URL_SCHEME' in environ: app.config['PREFERRED_URL_SCHEME'] = environ.get('PREFERRED_URL_SCHEME')