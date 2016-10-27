from flask import current_app
import requests

class LobsterProxy:
    @staticmethod
        def get_images(page):
            try:
                r = requests.get(
                    current_app.config['LOBSTER_CONTENT_URL'],
                    data={
                        'page': page,
                        'per_page': current_app.config['LOAD_PAGE_SIZE'],
                        'secret': current_app.config['LOBSTER_SECRET']
                    })
                return r.json()['results']
            except requests.exceptions:
                return None
