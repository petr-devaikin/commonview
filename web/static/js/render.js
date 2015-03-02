define(['libs/d3', 'libs/instafeed', 'palette', 'colorimage', 'proxy'],
    function(d3, instafeed, Palette, ColorImage, proxy) {
        var GROUP_SIZE = 4;

        var palette,
            feed = undefined,
            stopFlag = true;

        function setBackground(d) {
            if (d.image !== undefined)
                return 'url(' + d.image.imageUrl + ')';
            else
                return 'none';
        }

        function drawPalette() {
            var photos = d3.select('#mainPhoto').selectAll('.miniPhoto')
                    .data(palette.groups, function(d) {
                        return d.x + '/' + d.y;
                    })
                    .style('background-image', setBackground);

            photos.enter().append('div')
                    .classed('miniPhoto', true)
                    .attr('row', function(d) { return d.y; })
                    .attr('column', function(d) { return d.x; })
                    .style('background-image', setBackground);

            photos.exit().remove();

            updateAccuracy();
        }

        function updateAccuracy() {
            d3.select('#accuracy').text(palette.globalDiff);
        }

        function instagramSuccess(photos) {
            var uncomplete = photos.data.length;
            palette.next_max_tag_id = photos.pagination.next_max_tag_id;

            for (var i = 0; i < photos.data.length; i++) {
                var instaImage = photos.data[i];

                function imageProcessed() {
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


                var colorImage = new ColorImage(instaImage.id, instaImage.images.thumbnail.url);

                palette.addPhoto(colorImage, imageProcessed, imageFailed);
            }
        }

        return function(accessToken, picture_id, picture) {
            console.log('Start');
            palette = new Palette(picture, GROUP_SIZE);
            d3.shuffle(palette.groups);
            console.log('Generated');

            d3.select('#loadButton').on('click', function() {
                proxy.loadPalette(
                    picture_id,
                    palette,
                    function() {
                        drawPalette();
                        console.log('Palette loaded');
                    },
                    undefined,
                    function() {
                        d3.select('#tagName').property('value', palette.tagName);
                        drawPalette();
                        console.log('Initialized');
                    },
                    function(procentage) {
                        drawPalette();
                        console.log('Progress ' + procentage);
                    });
            })

            d3.select('#startButton').on('click', function() {
                stopFlag = false;
                if (feed === undefined) {
                    palette.tagName = d3.select('#tagName').property('value');

                    feed = new Instafeed({
                        accessToken: accessToken,
                        get: 'tagged',
                        tagName: palette.tagName,
                        sortBy: 'most-recent',
                        limit: 60,
                        success: instagramSuccess,
                        mock: true,
                        before: function() {
                            if (palette.next_max_tag_id !== undefined) {
                                var oldUrl = this._buildUrl();
                                this._buildUrl = function() {
                                    return oldUrl + '&max_tag_id=' + palette.next_max_tag_id;
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

            var hash; 

            d3.select('#stopButton').on('click', function() {
                stopFlag = true;
                proxy.savePalette(picture_id, palette, function() { console.log('Palette saved'); });
                //drawPalette();
                //console.log(JSON.stringify(palette.toHash()).length);
            })
        }
    });