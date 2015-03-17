define(['libs/instafeed', 'colorimage', 'helpers', 'settings'],
    function(instafeed, ColorImage, helpers, settings) {
    return function(params) {
        // params: accessToken, onListReceived, onPhotoLoaded, onComplete, onEmpty

        var stopped = true;

        var feed = undefined;

        this._onSuccess = function(picgrabber) {
            return function(photos) {
                if (params.onListReceived !== undefined)
                    params.onListReceived(photos.pagination.next_max_tag_id);

                var uncomplete = photos.data.length;

                for (var i = 0; i < photos.data.length; i++) {
                    var instaImage = photos.data[i];

                    var imageProcessed = function(picgrabber, colorImage) {
                        return function(img) {                         
                            colorImage.color = helpers.getImgDataColorsFromImage(img);
                            colorImage.exportData = helpers.getExportFragmentFromImage(img);

                            if (params.onPhotoLoaded !== undefined) 
                                params.onPhotoLoaded(colorImage);

                            if (--uncomplete == 0) {
                                if (params.onComplete !== undefined)
                                    params.onComplete(stopped);
                                if (!stopped && !feed.next() && params.onEmpty !== undefined)
                                    params.onEmpty();
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

            feed = new Instafeed({
                accessToken: params.accessToken,
                get: 'tagged',
                tagName: tagName,
                sortBy: 'most-recent',
                limit: 60,
                success: this._onSuccess,
                error: params.onEmpty,
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

        this.stop = function() {
            stopped = true;
        }
    }
})