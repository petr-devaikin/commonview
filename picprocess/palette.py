import json
from web.db.engine import get_db
from web.db.models import Fragment
from picprocess.image_helper import ImageHelper

class WrongDataException(Exception):
    pass

class Palette:
    @staticmethod
    def save_to_db(picture, json_data):
        data = json.loads(json_data)

        try:
            with get_db().atomic() as txn:
                picture.global_diff = data['globalDiff']
                picture.tag = data['tagName'] if 'tagName' in data else None
                picture.next_tag_id = data['next_max_tag_id'] if 'next_max_tag_id' in data else None

                picture.save()

                fragments_to_delete = [f for f in picture.fragments]
                for f in fragments_to_delete:
                    f.delete_instance()

                for x in data['groups']:
                    for y in data['groups'][x]:
                        fragment = Fragment(picture=picture)
                        if (fragment.from_hash(data['groups'][x][y])):
                            fragment.save()
                        else:
                            raise WrongDataException('Wrong data')

                ImageHelper.save_export_image(picture.get_export_path(), data['export'], picture.width, picture.height)
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
            y = str(f.row)
            x = str(f.column)
            if not x in groups:
                groups[x] = {}
            groups[x][y] = f.to_hash()

        return {
            'globalDiff': picture.global_diff,
            'tagName': picture.tag,
            'next_max_tag_id': picture.next_tag_id,
            'groups': groups,
        }

