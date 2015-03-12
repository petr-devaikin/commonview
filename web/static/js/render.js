define(['libs/d3', 'palette', 'proxy', 'picgrabber', 'drawing'],
    function(d3, Palette, proxy, PicGrabber, drawing) {
        var SAVE_PERIOD = 1000 * 30;

        var palette;

        var startButton = d3.selectAll('.startButton');
        var stopButton = d3.select('#pauseButton');
        var clearButton = d3.selectAll('.clearButton');
        var deleteButton = d3.select('#deleteButton');

        var allPanels = d3.selectAll('.panel'),
            startPanel = d3.select('#startPanel'),
            loadingPanel = d3.select('#loadingPanel'),
            resumePanel = d3.select('#resumePanel'),
            processingPanel = d3.select('#processingPanel'),
            completePanel = d3.select('#completePanel'),
            interruptionPanel = d3.select('#interruptionPanel'),
            savingPanel = d3.select('#savingPanel');


        function loadPalette() {
            palette.load({
                checkDeleted: true,
                onInit: function() {
                    //drawing.drawPalette(palette);
                    console.log('Initialized');
                },
                onProgress: function(percentage) {
                    drawing.showLoading(percentage);
                    console.log('Progress ' + percentage);
                },
                onComplete: function() {
                    drawing.drawPalette(palette);
                    if (palette.tagName == null) {
                        allPanels.style('display', 'none');
                        startPanel.style('display', 'block');
                    }
                    else if (palette.globalDiff > 0) {
                        allPanels.style('display', 'none');
                        resumePanel.style('display', 'block');
                    }
                    else {
                        allPanels.style('display', 'none');
                        completePanel.style('display', 'block');
                    }
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

        function clearPalette(pic_id, picture, groupSize) {
            console.log('Start');
            palette = new Palette(pic_id, picture, groupSize);
            console.log('Generated');
            return palette;
        }

        function deletePalette() {
            proxy.deletePalette(palette.picture_id, function() {
                window.location = '/';
            });
        }

        return function(accessToken, pic_id, picture, groupSize) {
            var lastSave = undefined;

            clearPalette(pic_id, picture, groupSize);

            loadPalette();

            var picGrabber = new PicGrabber({
                accessToken: accessToken,
                groupSize: groupSize,
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

                        allPanels.style('display', 'none');
                        resumePanel.style('display', 'block');
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
                allPanels.style('display', 'none');
                processingPanel.style('display', 'block');
            });

            stopButton.on('click', function() {
                picGrabber.stop();

                allPanels.style('display', 'none');
                savingPanel.style('display', 'block');
            })

            clearButton.on('click', function() {
                clearPalette(pic_id, picture, groupSize);
                drawing.drawPalette(palette);
                savePalette();

                d3.select('#tagName').attr('disabled', null);
                allPanels.style('display', 'none');
                startPanel.style('display', 'block');
            });

            deleteButton.on('click', deletePalette);

            d3.select('#tagName').on('focus', function() {
                this.select();
            });
        }
    });