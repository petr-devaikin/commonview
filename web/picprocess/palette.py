import json
from web.db.engine import get_db
from web.db.models import Fragment
from .image_helper import ImageHelper
from PIL import Image
import datetime

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
                picture.updated = datetime.datetime.now()

                picture.save()
                print 'PICTURE SAVED'

                print 'ALL FRAGMENTS SELECTED'

                for g in data['updatedGroups']:
                    upd = Fragment.update(x=g['x'], y=g['y'], diff=g['diff'])
                    upd = upd.where(Fragment.id == g['id'], Fragment.picture == picture)
                    upd.execute()

                print 'UPDATED: %d' % len(data['updatedGroups'])

                rc = Fragment.select()
                rc = rc.where(Fragment.id << data['removedPicrures'], Fragment.picture == picture)
                rc = rc.count()

                if rc:
                    dlt = Fragment.delete()
                    dlt = dlt.where(Fragment.id << data['removedPicrures'], Fragment.picture == picture)
                    dlt.execute()

                print 'REMOVED: %d' % rc

                to_remove = [f.id for f in picture.fragments.where(Fragment.x == None)]
                if len(to_remove) > 0:
                    Fragment.delete().where(Fragment.id << to_remove).execute()
                print 'EXTRA FRAGMENTS REMOVED: %d' % len(to_remove)
            return True
        except WrongDataException:
            return False


    @staticmethod
    def remove_from_db(picture):
        Fragment.delete().where(Fragment.picture == picture).execute()
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

