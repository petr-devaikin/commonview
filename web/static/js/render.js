define(['libs/d3', 'libs/instafeed', 'libs/qwest', 'palette'], function(d3, instafeed, qwest, Palette) {
        var GROUP_SIZE = 4,
            THUMBNAIL_SIZE = 150,
            RESIZE_URL = '/resize',
            IMG_URL = '/img',
            MAX_DIFF = 27,
            USE_SERVER = false;

        var palette,
            feed;

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
            var uncomplete = photos.data.length;
            for (var i = 0; i < photos.data.length; i++) {
                var instaImage = photos.data[i];
                var canvas = document.createElement('canvas'),
                    ctx = canvas.getContext('2d');

                canvas.width = GROUP_SIZE;
                canvas.height = GROUP_SIZE;

                function imageProcessed(img, colors) {
                    img.color = colors;
                    var globalDiff = palette.fill(img);
                    uncomplete--;                                
                    drawPalette();
                    if (uncomplete == 0 && globalDiff > MAX_DIFF)
                        feed.next();
                }

                if (USE_SERVER) {
                    qwest.get(RESIZE_URL, { url: instaImage.images.thumbnail.url })
                        .then(function(img) {
                                return function (colors) {
                                    imageProcessed(img, colors.colors);
                                }
                            }(instaImage));
                }
                else {
                    var image = new Image();
                    image.onload = function(img, instaImg) {
                        return function() {
                            ctx.drawImage(img, 0, 0, THUMBNAIL_SIZE, THUMBNAIL_SIZE, 0, 0, GROUP_SIZE, GROUP_SIZE);
                            var imgData = ctx.getImageData(0, 0, GROUP_SIZE, GROUP_SIZE);
                            var colors = [];
                            for (var j = 0; j < imgData.data.length; j++)
                                if (j % 4 < 3)
                                    colors.push(imgData.data[j]);
                            imageProcessed(instaImg, colors);
                        }
                    } (image, instaImage);
                    image.src = IMG_URL + '?url=' + instaImage.images.thumbnail.url;
                }
            }
        }

        return function(accessToken, picture) {
            console.log('Start');
            palette = new Palette(picture, GROUP_SIZE);
            palette.generate();
            d3.shuffle(palette.groups);
            console.log('Generated');

            feed = new Instafeed({
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