from flask import current_app
import requests
from ..logger import get_logger

class LobsterProxy:
    @staticmethod
    def get_images(page):
        try:
            r = requests.get(
                current_app.config['LOBSTER_CONTENT_URL'],
                params={
                    'page': page,
                    'per_page': current_app.config['LOAD_PAGE_SIZE'],
                    #'secret': current_app.config['LOBSTER_SECRET']
                },
                headers={
                    'X-Lobster-App-Secret': current_app.config['LOBSTER_SECRET']
                }
            )
            if 'error' in r.json() != None:
                get_logger().error('Lobster API error %s', r.json()['error'])
                return None
            else:
                return r.json()['results']
        except requests.exceptions as ex:
            get_logger().error('Lobster API error %s', ex)
            return None
