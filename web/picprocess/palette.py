import json
from web.db.engine import get_db
from web.db.models import Fragment
from .image_helper import ImageHelper
from PIL import Image
import datetime
from web.logger import get_logger

class Palette:
    @staticmethod
    def save_to_db(picture, json_data):
        data = json.loads(json_data)

        with get_db().atomic() as txn:
            picture.global_diff = data['globalDiff']
            picture.tag = data['tagName'] if 'tagName' in data else None
            picture.next_tag_id = data['next_max_tag_id'] if 'next_max_tag_id' in data else None
            picture.updated = datetime.datetime.now()

            picture.save()
            get_logger().debug('Palette %d saving: picture data saved. Global diff: %f', \
                picture.id, picture.global_diff)

            update_counter = 0
            for g in data['updatedGroups']:
                upd = Fragment.update(x=g['x'], y=g['y'], diff=g['diff'])
                update_counter += upd.where(Fragment.id == g['id'], Fragment.picture == picture).execute()

            if update_counter != len(data['updatedGroups']):
                get_logger().warning('Palette %d saving: %d fragments of %d updated', picture.id, \
                    update_counter, len(data['updatedGroups']))
            else:
                get_logger().debug('Palette %d saving: all %d fragments updated', picture.id, update_counter)

            
            if data['removedPicrures'] == 'all':
                delete_counter = Fragment.delete().where(Fragment.picture == picture).execute()
                get_logger().warning('Palette %d saving: fragments cleared (%d)', picture.id, delete_counter)
            else:
                dlt = Fragment.delete()
                dlt = dlt.where(Fragment.id << data['removedPicrures'], Fragment.picture == picture)
                delete_counter = dlt.execute()

                if delete_counter != len(data['removedPicrures']):
                    get_logger().warning('Palette %d saving: %d fragments of %d removed', picture.id, \
                        delete_counter, len(data['removedPicrures']))
                else:
                    get_logger().debug('Palette %d saving: all %d fragments removed', picture.id, delete_counter)

            to_remove_count = picture.fragments.where(Fragment.x == None).count()
            if to_remove_count > 0:
                Fragment.delete().where(Fragment.x == None, Fragment.picture == picture).execute()
                get_logger().warning('Palette %d saving: %d extra fragments removed', picture.id, to_remove_count)
            else:
                get_logger().debug('Palette %d saving: no extra fragments removed', picture.id)
        return True


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

