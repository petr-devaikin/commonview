import json
from web.db.engine import get_db
from web.db.models import Fragment
from .image_helper import ImageHelper
from PIL import Image
import datetime
from web.logger import get_logger
from flask import current_app

class Palette:
    # find a place on the palette for given array on new images. returns array of changed fragments
    @staticmethod
    def find_place(picture, images):
        changed_fragments = []

        buffer_images = []
        for i in images:
            if i['thumb'] == None:
                continue

            images = ImageHelper.get_image(i['thumb'])
            if images == None:
                continue

            high_res, low_res = images

            # check if there is this img already!!!

            buffer_images.append({
                'lobster_id': i['_id'],
                'lobster_url': current_app.config['LOBSTER_IMAGE_URL'] + i['_id'],
                'lobster_img': i['thumb'],
                'high_pic': high_res,
                'low_pic': low_res,
                'lab_pic': ImageHelper.calc_lab(low_res)
            })

        if len(buffer_images) > 0:
            fragments = [f for f in picture.fragments]
            for f in fragments:
                min_diff = None
                min_image = None
                for i in buffer_images:
                    diff = f.calc_diff(i['lab_pic'])
                    if min_diff == None or diff < min_diff:
                        min_diff = diff
                        min_image = i

                if not f.is_set():
                    f.set_image(min_image, min_diff)
                    buffer_images.remove(min_image)
                    changed_fragments.append(f)
                elif f.diff > min_diff:
                    min_image_copy = min_image.copy()
                    min_image['lobster_id'] = f.lobster_id
                    min_image['lobster_url'] = f.lobster_url
                    min_image['lobster_img'] = f.lobster_img
                    min_image['high_pic'] = f.high_pic
                    min_image['low_pic'] = f.low_pic
                    min_image['lab_pic'] = f.get_lab()
                    f.set_image(min_image_copy, min_diff)
                    changed_fragments.append(f)

                if len(buffer_images) == 0:
                    break

        # save changed fragments
        for c in changed_fragments:
            c.save()

        return changed_fragments


    # Removes picture and its fragments from db
    @staticmethod
    def remove_from_db(picture):
        Fragment.delete().where(Fragment.picture == picture).execute()
        picture.delete_instance()

