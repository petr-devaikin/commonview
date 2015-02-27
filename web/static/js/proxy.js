define(['libs/qwest'], function(qwest) {
    return {
        getImageUrl: function(originalUrl) {
            return '/img?url=' + originalUrl;
        },
        savePalette: function(pictureId, palette, success, error) {
            var hash = JSON.stringify(palette.toHash());
            qwest.post('/palette/' + pictureId, { palette: hash })
                .then(function(response) {
                    if (success !== undefined) success();
                })
                .catch(function(ex) {
                    if (error !== undefined) error();
                });
        },
        loadPalette: function(pictureId, palette, success, error, init, progress) {
            qwest.get('/palette/' + pictureId)
                .then(function(response) {
                    palette.fromHash({
                        data: response,
                        onInit: init,
                        onComplete: success,
                        onProgress: progress,
                    });
                })
                .catch(function(ex) {
                    if (error !== undefined) error();
                });
        },
    }
});