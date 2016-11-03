define(['proxy', 'settings'],
    function(proxy, settings) {
    return function(params) {
        // params: picId, onListReceived, onPhotoLoaded, onComplete, onEmpty
        var feed = undefined;

        this._onSuccess = function(picgrabber) {
            return function(photos) {
                for (var i = 0; i < photos.length; i++) {
                    var image = photos.data[i];
                    params.onPhotoLoaded(image);
                }
                params.onComplete();
            }
        } (this);

        this.start = function() {
            proxy.getImages(
                params.picId,
                this._onSuccess,
                params.onEmpty
            );
        }
    }
})
