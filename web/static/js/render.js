define(['libs/d3', 'palette', 'proxy', 'picgrabber', 'drawing'],
    function(d3, Palette, proxy, PicGrabber, drawing) {
        var palette;

        var startButton = d3.select('#startButton');
        var resumeButton = d3.select('#resumeButton');
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

        var isStopped = true;


        function loadPalette(paletteData) {
            console.log(paletteData);
            palette.load({
                data: paletteData,
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

                    allPanels.style('display', 'none');
                    if (palette.tagName == null) {
                        startPanel.style('display', 'block');
                    }
                    else if (palette.globalDiff > 0) {
                        if (palette.next_max_tag_id !== null)
                            resumePanel.style('display', 'block');
                        else
                            interruptionPanel.style('display', 'block');
                    }
                    else {
                        completePanel.style('display', 'block');
                    }

                    console.log('Palette loaded');
                },
                onError: function() {
                    console.log('Palette loading error');
                }
            });
        }

        function savePalette(success, error) {
            palette.save({
                onSuccess: function() {
                    console.log('Palette saved');
                    if (success !== undefined) success();
                },
                onError: function(ex) {
                    console.log('Palette saving error: ' + ex);
                    if (error !== undefined) error();
                }
            });
        }

        function clearPalette(pic_id, picture) {
            console.log('Start');
            palette = new Palette(pic_id, picture);
            console.log('Generated');
            return palette;
        }

        function deletePalette() {
            proxy.deletePalette(palette.picture_id, function() {
                window.location = '/';
            });
        }

        return function(accessToken, pic_id, picture, paletteData) {
            var lastSave = undefined;

            clearPalette(pic_id, picture);

            loadPalette(paletteData);

            var picGrabber = new PicGrabber({
                picId: pic_id,
                accessToken: accessToken,
                onListReceived: function(nextTag) {
                    palette.next_max_tag_id = nextTag;
                },
                onPhotoLoaded: function(colorImage) {
                    palette.addPhoto(colorImage);

                    if (palette.globalDiff == 0)
                        picGrabber.stop();
                },
                onComplete: function() {
                    drawing.drawPalette(palette);
                    if (isStopped) {
                        savePalette();

                        allPanels.style('display', 'none');
                        if (palette.globalDiff > 0)
                            resumePanel.style('display', 'block');
                        else
                            completePanel.style('display', 'block');
                    }
                    else {
                        console.log('Start saving');
                        savePalette(
                            function() {
                                picGrabber.start(palette.tagName, palette.next_max_tag_id);
                            },
                            function() {
                                allPanels.style('display', 'none');
                                resumePanel.style('display', 'block');
                            }
                        );
                    }
                },
                onEmpty: function(error) {
                    drawing.drawPalette(palette);
                    savePalette();
                    allPanels.style('display', 'none');
                    interruptionPanel.style('display', 'block');
                    console.log('Empty feed');
                }
            });

            function startProcess() {
                if (!palette.tagName)
                    palette.tagName = d3.select('#tagName').property('value');

                isStopped = false;
                picGrabber.start(palette.tagName, palette.next_max_tag_id);

                d3.select('#tagName').attr('disabled', 'disabled');
                allPanels.style('display', 'none');
                processingPanel.style('display', 'block');
            }

            startButton.on('click', startProcess);
            resumeButton.on('click', startProcess);

            stopButton.on('click', function() {
                isStopped = true;

                allPanels.style('display', 'none');
                savingPanel.style('display', 'block');
            })

            clearButton.on('click', function() {
                clearPalette(pic_id, picture);
                savePalette();
                drawing.drawPalette(palette);

                d3.select('#tagName').attr('disabled', null);
                allPanels.style('display', 'none');
                startPanel.style('display', 'block');
            });

            deleteButton.on('click', deletePalette);

            d3.select('#tagName').on('focus', function() {
                this.select();
            });

            d3.select('#tagName').on('input', function() {
                var s = d3.select('#tagName').property('value');
                var filter = /[\s`~!@#$%^&*()|+\-=?;:'",.<>\{\}\[\]\\\/]/gi;
                if (s.match(filter))
                    d3.select('#tagName').property('value', s.replace(filter, ''));

                if (d3.select('#tagName').property('value') == '')
                    startButton.attr('disabled', 'disabled');
                else
                    startButton.attr('disabled', null);
            });

            drawing.setZoomer();

            /*
            proxy.getImageColor(
                pic_id,
                {
                    insta_id: '123',
                    insta_img: 'https://scontent-ams.cdninstagram.com/hphotos-xaf1/t51.2885-15/e15/11024323_354048768115499_2017163424_n.jpg',
                    insta_url: 'qweqweqwe',
                    insta_user: 'user',
                },
                function(result) {
                    console.log(result);
                }
            );
            */
        }
    });