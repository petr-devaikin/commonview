define(['libs/qwest', 'settings'], function(qwest, settings) {
    return {
        deletePalette: function(pictureId, success, error) {
            qwest.delete('/pic/' + pictureId)
                .then(function(response) {
                    if (success !== undefined) success();
                })
                .catch(function(ex) {
                    if (error !== undefined) error();
                });
        },
        clearPalette: function(pictureId, success, error) {
            qwest.delete('/palette/' + pictureId)
                .then(function(response) {
                    if (success !== undefined) success();
                })
                .catch(function(ex) {
                    if (error !== undefined) error();
                });
        },
        loadNewImages: function(pictureId, success, error) {
            qwest.get('/palette/' + pictureId + '/update', {}, { timeout: settings.getImageTimeout })
                .then(function(response) {
                    if (success !== undefined) success(response);
                })
                .catch(function(ex) {
                    if (error !== undefined) error();
                })
        },
    }
});
