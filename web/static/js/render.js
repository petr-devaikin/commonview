define(['libs/d3', 'palette', 'proxy', 'picgrabber', 'drawing'],
    function(d3, Palette, proxy, PicGrabber, drawing) {
        var GROUP_SIZE = 5,
            SAVE_PERIOD = 1000 * 30;

        var palette;

        var startButton = d3.select('#startButton');
        var stopButton = d3.select('#stopButton');
        var clearButton = d3.select('#clearButton');
        var deleteButton = d3.select('#deleteButton');


        function loadPalette() {
            palette.load({
                onInit: function() {
                    drawing.drawPalette(palette);
                    console.log('Initialized');
                },
                onProgress: function(procentage) {
                    drawing.drawPalette(palette);
                    console.log('Progress ' + procentage);
                },
                onComplete: function() {
                    drawing.drawPalette(palette);
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
            return palette;
        }

        function deletePalette() {
            proxy.deletePalette(palette.picture_id, function() {
                window.location = '/';
            });
        }

        return function(accessToken, pic_id, picture) {
            var lastSave = undefined;

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
                    drawing.drawPalette(palette);
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

                d3.select('#tagName').attr('disabled', 'disabled');
                startButton.attr('disabled', 'disabled');
                stopButton.attr('disabled', null);
            });

            stopButton.on('click', function() {
                stopButton.attr('disabled', 'disabled');
                drawing.showSaving();
                picGrabber.stop();
            })

            clearButton.on('click', function() {
                // stop before clear!!!!!!!!!!!!!!!!

                clearPalette(pic_id, picture);
                drawing.drawPalette(palette);
                savePalette();
                d3.select('#tagName').attr('disabled', null);
            });

            deleteButton.on('click', deletePalette);

            d3.select('#tagName').on('focus', function() {
                this.select();
            });
        }
    });