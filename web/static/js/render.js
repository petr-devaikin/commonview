define(['libs/d3', 'libs/instafeed', 'libs/qwest', 'palette'], function(d3, instafeed, qwest, Palette) {
        var GROUP_SIZE = 40,
            THUMBNAIL_SIZE = 150,
            RESIZE_URL = '/resize';

        var palette;

        function drawPalette() {
            d3.select('#mainPhoto').selectAll('.miniPhoto')
                .data(palette.groups)
                .style('background-image', function(d) {
                    if (d.image !== undefined)
                        return 'url(' + d.image.images.thumbnail.url + ')';
                    else
                        return '';
                })
            .enter().append('div')
                .classed('miniPhoto', true)
                .attr('row', function(d) { return d.y; })
                .attr('column', function(d) { return d.x; });
        }

        function instagramSuccess(photos) {
            for (var i = 0; i < photos.data.length; i++) {
                var instaImage = photos.data[i];
                qwest.get(RESIZE_URL, { url: instaImage.images.thumbnail.url })
                    .then(function(img) {
                            return function (colors) {
                                img.color = colors.colors;
                                palette.fill(img);
                                drawPalette();
                            }
                        }(instaImage));
            }
        }

        return function(accessToken, picture) {
            console.log('Start');
            palette = new Palette(picture);
            palette.generate();
            console.log('Generated');

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