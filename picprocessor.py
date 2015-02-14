from PIL import Image
from instagram import client
import urllib2, cStringIO
from web.db.models import *


def get_palette(path, small_width):
    image = Image.open(path)
    width, height = image.size
    small_height = height * small_width / width
    small_img = image.resize((small_width, small_height), Image.ANTIALIAS)

    palette = []
    for i in range(small_width):
        for j in range(small_height):
            pixel = small_img.getpixel((i, j))
            palette.append({
                'x': i,
                'y': j,
                'color': pixel,
                'image': None,
                'diff': 255
            })

    return palette


def load_palette_from_db(picture):
    palette = []
    for f in picture.fragments:
        palette.append({
            'x': f.column,
            'y': f.row,
            'color': (f.r, f.g, f.b),
            'image': None,
            'diff': 255
        })

    return palette


def save_palette_to_db(picture, palette):
    for p in palette:
        r = p['color'][0]
        g = p['color'][1]
        b = p['color'][2]
        fragment = Fragment.create(picture=picture, row=p['y'], column=p['x'], r=r, g=g, b=b)
        if p['image']:
            fragment.insta_id = p['image'].id
            fragment.insta_img = p['image'].get_thumbnail_url()
            fragment.insta_url = p['image'].url
            fragment.insta_user = p['image'].user
            fragment.save()


def get_web_image_color(url):
    f = cStringIO.StringIO(urllib2.urlopen(url).read())
    img = Image.open(f)
    colour_tuple = [None, None, None]
    for channel in range(3):
        pixels = img.getdata(band=channel)
        colour_tuple[channel] = sum(pixels) / len(pixels)
    return colour_tuple

def media_to_img_meta(m):
    return {
        'url': m.get_thumbnail_url(),
        'color': get_web_image_color(m.get_thumbnail_url()) 
    }


def fill_palette(palette, config, tag):
    insta = client.InstagramAPI(client_id=config['INSTA_ID'], client_secret=config['INSTA_SECRET'])

    params = {
        'count': 50,
        'tag_name': tag,
    }

    threshold = 15

    counter = 0
    global_diff = 255

    while global_diff > threshold and counter < config['MAX_ITERATIONS']:
        counter += 1
        media, next_ = insta.tag_recent_media(**params)

        currently_found = 0
        free_media = [media_to_img_meta(m) for m in media]
        i = 0
        print len(free_media)
        while i < len(free_media):
            first_fixed = True
            current_media = free_media[i]
            i += 1
            for p in palette:
                diff = max([abs(a - b) for a, b in zip(p['color'], current_media['color'])])
                if p['image'] == None or p['diff'] > diff:
                    if p['image'] != None:
                        free_media.append(p['image'])
                    p['image'] = current_media
                    p['diff'] = diff
                    currently_found += 1
                    break

        global_diff = sum([p['diff'] for p in palette]) / float(len(palette))
        print 'Currently found: %d' % currently_found
        print 'Global diff: ' + str(global_diff)

        params['with_next_url'] = next_