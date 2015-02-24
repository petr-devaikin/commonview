define(['libs/d3', 'libs/instafeed', 'libs/qwest'], function(d3, instafeed, qwest) {
    var GROUP_SIZE = 40,
        THUMBNAIL_SIZE = 150,
        RESIZE_URL = '/resize';

    function instagramSuccess(photos) {
        console.log(photos);

        for (var i = 0; i < photos.data.length; i++) {
            qwest.get(RESIZE_URL, { url: photos.data[i].images.thumbnail.url })
                .then(function (colors) {
                    console.log(colors);
                });
        }
    }

    return function(accessToken, palette) {
        var
        
        var feed = new Instafeed({
            accessToken: accessToken,
            get: 'tagged',
            tagName: 'london',
            sortBy: 'most-recent',
            limit: 60,
            success: instagramSuccess,
            mock: true,
        });
        feed.run();
    }
});