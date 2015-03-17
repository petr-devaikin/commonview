define(['libs/instafeed', 'proxy', 'settings'],
    function(instafeed, proxy, settings) {
    return function(params) {
        // params: accessToken, picId, onListReceived, onPhotoLoaded, onComplete, onEmpty
        var feed = undefined;

        this._onSuccess = function(picgrabber) {
            return function(photos) {
                if (params.onListReceived !== undefined)
                    params.onListReceived(photos.pagination.next_max_tag_id);

                var uncomplete = photos.data.length;

                for (var i = 0; i < photos.data.length; i++) {
                    var instaImage = photos.data[i];

                    function imageProcessed(newImage) {
                        if (params.onPhotoLoaded !== undefined) 
                            params.onPhotoLoaded(newImage);

                        if (--uncomplete == 0) {
                            if (params.onComplete !== undefined)
                                params.onComplete();
                        }
                    } 

                    function imageFailed() {
                        console.log('Cannot load new image');
                        if (--uncomplete == 0) {
                            if (params.onComplete !== undefined)
                                params.onComplete();
                        }
                    }

                    var palette = this;
                    proxy.getImageColor(
                        params.picId,
                        {
                            insta_id: instaImage.id,
                            insta_img: instaImage.images.thumbnail.url,
                            insta_url: instaImage.link,
                            insta_user: instaImage.user.username,
                        },
                        imageProcessed,
                        imageFailed
                    );
                }
            }
        } (this);

        this.start = function(tagName, nextTag) {
            feed = new Instafeed({
                accessToken: params.accessToken,
                get: 'tagged',
                tagName: tagName,
                sortBy: 'most-recent',
                limit: settings.uploadStep,
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
    }
})