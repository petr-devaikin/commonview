define(['libs/instafeed', 'proxy', 'settings', 'json!data/collection_thumbs.json'],
    function(instafeed, proxy, settings, lobster_data) {
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
            var i = 0;
            var current_images = {
                data: [],
                pagination: {
                    next_max_tag_id: 'sorry_nope'
                },
            };

            while (lobster_data.length > 0 && i++ < settings.uploadStep) {
                var img = lobster_data.shift();
                current_images.data.push({
                    id: img.url,
                    images: {
                        thumbnail: {
                            url: img.thumb,
                        },
                    },
                    link: 'https://lobster.media' + img.url,
                    user: {
                        username: 'lobster',
                    }
                });
            }

            if (current_images.data.length == 0)
                params.onEmpty();
            else
                this._onSuccess(current_images);

            /*
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
            */
        }
    }
})
