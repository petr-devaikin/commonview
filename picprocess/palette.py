import json
from web.db.engine import get_db
from web.db.models import Fragment
from picprocess.image_helper import ImageHelper
from PIL import Image

class WrongDataException(Exception):
    pass

class Palette:
    @staticmethod
    def save_to_db(picture, json_data):
        print 'START SAVING'
        data = json.loads(json_data)
        print 'CONVERTED'

        try:
            with get_db().atomic() as txn:
                picture.global_diff = data['globalDiff']
                picture.tag = data['tagName'] if 'tagName' in data else None
                picture.next_tag_id = data['next_max_tag_id'] if 'next_max_tag_id' in data else None

                picture.save()
                print 'PICTURE SAVED'

                to_remove = [f.id for f in picture.fragments]
                print 'ALL FRAGMENTS SELECTED'

                for g in data['groups']:
                    if g['id'] in to_remove:
                        Fragment.update(x=g['x'], y=g['y'], diff=g['diff']).where(Fragment.id == g['id']).execute()
                        to_remove.remove(g['id'])
                    else:
                        raise WrongDataException('Wrong data')
                print 'ALL FRAGMENTS UPDATED'

                Fragment.delete().where(Fragment.id << to_remove).execute()
                print 'EXTRA FRAGMENTS REMOVED'
            return True
        except WrongDataException:
            return False


    @staticmethod
    def remove_from_db(picture):
        with get_db().atomic() as txn:
            fragments_to_delete = [f for f in picture.fragments]
            for f in fragments_to_delete:
                f.delete_instance()

            picture.delete_instance()


    @staticmethod
    def load_from_db(picture):
        groups = {}
        for f in picture.fragments:
            if f.x != None and f.y != None:
                y = str(f.y)
                x = str(f.x)
                if not x in groups:
                    groups[x] = {}
                groups[x][y] = f.to_hash()

        return {
            'globalDiff': picture.global_diff,
            'tagName': picture.tag,
            'next_max_tag_id': picture.next_tag_id,
            'groups': groups,
        }

