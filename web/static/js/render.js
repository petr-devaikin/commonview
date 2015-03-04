define(['libs/d3', 'palette', 'proxy', 'picgrabber'], function(d3, Palette, proxy, PicGrabber) {
        var GROUP_SIZE = 4,
            SAVE_PERIOD = 1000 * 30;

        var palette;

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
            palette.load({
                onInit: function() {
                    if (palette.tagName) {
                        d3.select('#tagName').property('value', palette.tagName);
                        d3.select('#tagName').attr('disabled', 'disabled');
                    }
                    drawPalette();
                    console.log('Initialized');
                },
                onProgress: function(procentage) {
                    drawPalette();
                    console.log('Progress ' + procentage);
                },
                onComplete: function() {
                    drawPalette();
                    startButton.attr('disabled', null);
                    console.log('Palette loaded');
                },
                onError: function() {
                    console.log('Palette loading error');
                }
            });
        }

        function savePalette() {
            palette.save({
                onSuccess: function() {
                    console.log('Palette saved');
                },
                onError: function() {
                    console.log('Palette saving error');
                }
            });
        }

        function clearPalette(pic_id, picture) {
            console.log('Start');
            palette = new Palette(pic_id, picture, GROUP_SIZE);
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

            var picGrabber = new PicGrabber({
                accessToken: accessToken,
                groupSize: GROUP_SIZE,
                onListReceived: function(nextTag) {
                    palette.next_max_tag_id = nextTag;
                },
                onPhotoLoaded: function(colorImage) {
                    palette.addPhoto(colorImage);
                },
                onComplete: function(isStopped) {
                    drawPalette();
                    if (isStopped) {
                        savePalette();
                        startButton.attr('disabled', null);
                    }
                    else if ((new Date()) - lastSave > SAVE_PERIOD) {
                        lastSave = new Date();
                        savePalette();
                    }
                },
            });

            startButton.on('click', function() {
                lastSave = new Date();
                stopCallback = undefined;

                if (!palette.tagName)
                    palette.tagName = d3.select('#tagName').property('value');

                picGrabber.start(palette.tagName, palette.next_max_tag_id);

                startButton.attr('disabled', 'disabled');
                stopButton.attr('disabled', null);
            });

            stopButton.on('click', function() {
                stopButton.attr('disabled', 'disabled');

                picGrabber.stop();
            })

            clearButton.on('click', function() {
                clearPalette(pic_id, picture);
                drawPalette();
                savePalette();
            });

            deleteButton.on('click', deletePalette);
        }
    });