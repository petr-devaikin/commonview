define(['libs/instafeed', 'colorimage', 'helpers'], function(instafeed, ColorImage, helpers) {
    return function(params) {
        // params: groupSize, accessToken, onListReceived, onPhotoLoaded, onComplete

        var stopped = true;

        var feed = undefined;
        var canvas = document.createElement('canvas'),
            ctx = canvas.getContext('2d');

        canvas.width = params.groupSize;
        canvas.height = params.groupSize;

        this._onSuccess = function(picgrabber) {
            return function(photos) {
                if (params.onListReceived !== undefined)
                    params.onListReceived(photos.pagination.next_max_tag_id);

                var uncomplete = photos.data.length;

                for (var i = 0; i < photos.data.length; i++) {
                    var instaImage = photos.data[i];

                    var imageProcessed = function(picgrabber, colorImage) {
                        return function(img) {
                            ctx.drawImage(img, 0, 0, img.width, img.height,
                                               0, 0, params.groupSize, params.groupSize);
                            var imgData = ctx.getImageData(0, 0, params.groupSize, params.groupSize),
                                colors = helpers.getImgDataColors(imgData);
                            
                            colorImage.color = colors;

                            if (params.onPhotoLoaded !== undefined) 
                                params.onPhotoLoaded(colorImage);

                            if (--uncomplete == 0) {
                                if (params.onComplete !== undefined)
                                    params.onComplete(stopped);

                                if (!stopped)
                                    feed.next();
                            }
                        }
                    } (
                        this,
                        new ColorImage(
                            instaImage.id,
                            instaImage.images.thumbnail.url,
                            instaImage.link,
                            instaImage.user.username
                        )
                    );

                    function imageFailed(picgrabber) {
                        if (--uncomplete == 0) {
                            if (params.onComplete !== undefined)
                                params.onComplete(stopped);

                            if (!stopped)
                                feed.next();
                        }
                    }

                    var palette = this;
                    helpers.loadImgByUrl({
                        url: instaImage.images.thumbnail.url,
                        success: imageProcessed,
                        error: imageFailed,
                    });
                    //////palette.addPhoto(colorImage, imageProcessed, imageFailed);
                }
            }
        } (this);

        this.start = function(tagName, nextTag) {
            stopped = false;

            if (feed === undefined) {
                feed = new Instafeed({
                    accessToken: params.accessToken,
                    get: 'tagged',
                    tagName: tagName,
                    sortBy: 'most-recent',
                    limit: 60,
                    success: this._onSuccess,
                    mock: true,
                    before: function() {
                        if (nextTag) {
                            var oldUrl = this._buildUrl();
                            this._buildUrl = function() {
                                return oldUrl + '&max_tag_id=' + nextTag;
                            }
                        }
                    }
                });
                feed.run();
            }
            else
                feed.next();
        }

        this.stop = function() {
            stopped = true;
        }
    }
})