define(['libs/d3', 'libs/instafeed', 'palette', 'helpers'], function(d3, instafeed, Palette, helpers) {
        var GROUP_SIZE = 4,
            THUMBNAIL_SIZE = 150,
            IMG_URL = '/img';

        var palette,
            feed = undefined,
            stopFlag = true;

        function drawPalette() {
            d3.select('#mainPhoto').selectAll('.miniPhoto')
                .data(palette.groups)
                .style('background-image', function(d) {
                    if (d.image !== undefined)
                        return 'url(' + d.image.imgUrl + ')';
                    else
                        return '';
                })
            .enter().append('div')
                .classed('miniPhoto', true)
                .attr('row', function(d) { return d.y; })
                .attr('column', function(d) { return d.x; });
        }

        function updateAccuracy(globalDiff) {
            d3.select('#accuracy').text(palette.globalDiff);
        }

        function instagramSuccess(photos) {
            var uncomplete = photos.data.length;
            palette.next_max_tag_id = photos.pagination.next_max_tag_id;

            for (var i = 0; i < photos.data.length; i++) {
                var instaImage = photos.data[i];
                var canvas = document.createElement('canvas'),
                    ctx = canvas.getContext('2d');

                canvas.width = GROUP_SIZE;
                canvas.height = GROUP_SIZE;

                function imageProcessed(img, colors) {
                    palette.fill(img, colors);
                    updateAccuracy();
                    drawPalette();

                    uncomplete--;
                    if (uncomplete == 0 && !stopFlag)
                        feed.next();
                }

                function imageFailed() {
                    uncomplete--;
                    if (uncomplete == 0 && !stopFlag)
                        feed.next();
                }

                helpers.loadImg({
                    url: IMG_URL + '?url=' + instaImage.images.thumbnail.url,
                    success: function(instaImg) {
                        return function(img) {
                            ctx.drawImage(img, 0, 0, THUMBNAIL_SIZE, THUMBNAIL_SIZE, 0, 0, GROUP_SIZE, GROUP_SIZE);
                            var imgData = ctx.getImageData(0, 0, GROUP_SIZE, GROUP_SIZE),
                                colors = helpers.getImgDataColors(imgData);
                            imageProcessed(instaImg, colors);
                        }
                    } (instaImage),
                    error: imageFailed,
                });
            }
        }

        return function(accessToken, picture, max_tag_id) {
            console.log('Start');
            palette = new Palette();
            palette.generate(picture, GROUP_SIZE);
            d3.shuffle(palette.groups);
            console.log('Generated');

            d3.select('#startButton').on('click', function() {
                stopFlag = false;
                if (feed === undefined) {
                    var tagName = d3.select('#tagName').attr('value');

                    feed = new Instafeed({
                        accessToken: accessToken,
                        get: 'tagged',
                        tagName: tagName,
                        sortBy: 'most-recent',
                        limit: 60,
                        success: instagramSuccess,
                        mock: true,
                        before: function() {
                            if (max_tag_id !== undefined) {
                                var oldUrl = this._buildUrl();
                                this._buildUrl = function() {
                                    return oldUrl + '&max_tag_id=' + max_tag_id;
                                }
                            }
                        }
                    });

                    feed.run();
                }
                else {
                    feed.next();
                }
            })

            d3.select('#stopButton').on('click', function() {
                stopFlag = true;
                console.log(JSON.stringify(palette.toHash()).length);
            })
        }
    });