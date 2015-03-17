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
        data = json.loads(json_data)

        try:
            with get_db().atomic() as txn:
                export = Image.open(picture.get_export_path())

                picture.global_diff = data['globalDiff']
                picture.tag = data['tagName'] if 'tagName' in data else None
                picture.next_tag_id = data['next_max_tag_id'] if 'next_max_tag_id' in data else None

                picture.save()

                for x in data['groups']:
                    for y in data['groups'][x]:
                        try:
                            fragment = Fragment.get(picture=picture, x=x, y=y)
                        except Fragment.DoesNotExist:
                            fragment = Fragment(picture=picture)

                        if (fragment.from_hash(data['groups'][x][y])):
                            export_data = data['groups'][x][y]['image']['exportData']
                            ImageHelper.draw_fragment(export, x, y, export_data)
                            fragment.save()
                        else:
                            raise WrongDataException('Wrong data')

                export.save(picture.get_export_path())
            return True
        except WrongDataException:
            return False


    @staticmethod
    def clear(picture):
        with get_db().atomic() as txn:
            fragments_to_delete = [f for f in picture.fragments]
            for f in fragments_to_delete:
                f.delete_instance()

            picture.global_diff = 255
            picture.tag = None
            picture.next_tag_id = None

            picture.save()


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

