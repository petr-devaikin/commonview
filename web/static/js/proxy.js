define(['libs/qwest'], function(qwest) {
    return {
        getImageUrl: function(originalUrl) {
            return '/img?url=' + originalUrl;
        },
        savePalette: function(pictureId, data, success, error) {
            qwest.post('/palette/' + pictureId, { palette: data })
                .then(success)
                .catch(error);
        },
        loadPalette: function(pictureId, success, error) {
            qwest.get('/palette/' + pictureId)
                .then(success)
                .catch(error);
        },
        deletePalette: function(pictureId, success, error) {
            qwest.delete('/palette/' + pictureId)
                .then(function(response) {
                    if (success !== undefined) success();
                })
                .catch(function(ex) {
                    if (error !== undefined) error();
                });
        },
    }
});