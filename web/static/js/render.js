define(['libs/d3', 'libs/instafeed'], function(d3, instafeed) {
    return function(accessToken, palette) {
        var feed = new Instafeed({
            get: 'tagged',
            tagName: 'london',
            accessToken: accessToken
        });
        feed.run();
    }
});