define(['libs/qwest', 'settings'], function(qwest, settings) {
    return {
        getImages: function(id, success, error) {
            //params: insta_id, insta_img, insta_url, insta_user
            qwest.get('/palette/' + id + '/update', {}, { timeout: settings.getImageTimeout })
                .then(function(response) {
                    if (success !== undefined) success(response);
                })
                .catch(function(response) {
                    if (error !== undefined) error(response);
                });
        },
        savePalette: function(pictureId, data, success, error) {
            qwest.post('/palette/' + pictureId + '/save', { data: data })
                .then(success)
                .catch(error);
        },
        deletePalette: function(pictureId, success, error) {
            qwest.delete('/pic/' + pictureId)
                .then(function(response) {
                    if (success !== undefined) success();
                })
                .catch(function(ex) {
                    if (error !== undefined) error();
                });
        },
        loadRemoteImage: function(params) {
            // params: url, success, error

            var image = new Image();

            image.onload = function() {
                if ('naturalHeight' in this && this.naturalHeight + this.naturalWidth !== 0)
                    params.success(this);
                else {
                    console.log('Error: empty image');
                    params.error();
                }
            }

            image.onerror = function(e) {
                console.log('Error: ' + e);
                if (params.error !== undefined) params.error();
            }

            image.src = params.url;
        },
    }
});
