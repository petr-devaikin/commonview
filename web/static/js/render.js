define(['libs/d3', 'libs/instafeed', 'palette', 'colorimage', 'proxy'],
    function(d3, instafeed, Palette, ColorImage, proxy) {
        var GROUP_SIZE = 4,
            SAVE_PERIOD = 1000 * 30;

        var palette,
            feed = undefined,
            stopCallback = true;

        var startButton = d3.select('#startButton');
        var stopButton = d3.select('#stopButton');
        var clearButton = d3.select('#clearButton');
        var deleteButton = d3.select('#deleteButton');

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

        var lastSave = undefined;
        function instagramSuccess(photos) {
            var uncomplete = photos.data.length;
            palette.next_max_tag_id = photos.pagination.next_max_tag_id;

            for (var i = 0; i < photos.data.length; i++) {
                var instaImage = photos.data[i];

                function imageProcessed() {
                    drawPalette();

                    if (--uncomplete == 0) {
                        if (stopCallback === undefined) {
                            if ((new Date()) - lastSave > SAVE_PERIOD) {
                                lastSave = new Date();
                                savePalette();
                            }
                            feed.next();
                        }
                        else
                            stopCallback();
                    }
                }

                function imageFailed() {
                    if (--uncomplete == 0) {
                        if (stopCallback === undefined)
                            feed.next();
                        else
                            stopCallback();
                    }
                }


                var colorImage = new ColorImage(instaImage.id, instaImage.images.thumbnail.url);

                palette.addPhoto(colorImage, imageProcessed, imageFailed);
            }
        }


        function loadPalette() {
            proxy.loadPalette(
                    palette.picture_id,
                    palette,
                    function() {
                        drawPalette();
                        startButton.attr('disabled', null);
                        console.log('Palette loaded');
                    },
                    undefined,
                    function() {
                        if (palette.tagName) {
                            d3.select('#tagName').property('value', palette.tagName);
                            d3.select('#tagName').attr('disabled', 'disabled');
                        }
                        drawPalette();
                        console.log('Initialized');
                    },
                    function(procentage) {
                        drawPalette();
                        console.log('Progress ' + procentage);
                    });
        }

        function savePalette() {
            proxy.savePalette(palette.picture_id, palette, function() {
                console.log('Palette saved');
            });
        }

        function clearPalette(pic_id, picture) {
            console.log('Start');
            palette = new Palette(pic_id, picture, GROUP_SIZE);
            d3.shuffle(palette.groups);
            console.log('Generated');
            d3.select('#tagName').attr('disabled', null);
            feed = undefined;
        }

        function deletePalette() {
            proxy.deletePalette(palette.picture_id, function() {
                window.location = '/';
            });
        }

        return function(accessToken, pic_id, picture) {
            startButton.attr('disabled', 'disabled');
            stopButton.attr('disabled', 'disabled');

            clearPalette(pic_id, picture);

            loadPalette();

            startButton.on('click', function() {
                lastSave = new Date();
                stopCallback = undefined;

                if (feed === undefined) {
                    if (!palette.tagName)
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
                            if (palette.next_max_tag_id) {
                                var oldUrl = this._buildUrl();
                                this._buildUrl = function() {
                                    return oldUrl + '&max_tag_id=' + palette.next_max_tag_id;
                                }
                            }
                        }
                    });

                    feed.run();
                }
                else
                    feed.next();


                startButton.attr('disabled', 'disabled');
                stopButton.attr('disabled', null);
            });

            stopButton.on('click', function() {
                stopButton.attr('disabled', 'disabled');

                stopCallback = function() {
                    savePalette();
                    startButton.attr('disabled', null);
                }
            })

            clearButton.on('click', function() {
                clearPalette(pic_id, picture);
                drawPalette();
                savePalette();
            });

            deleteButton.on('click', deletePalette);
        }
    });