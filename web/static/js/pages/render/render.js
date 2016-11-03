define(['libs/d3', 'palette', 'proxy', 'picgrabber', 'drawing', './panels'],
    function(d3, Palette, proxy, PicGrabber, drawing, panels) {
        var palette;

        var startButton = d3.select('#startButton');
        var resumeButton = d3.select('#resumeButton');
        var stopButton = d3.select('#pauseButton');
        var clearButton = d3.selectAll('.clearButton');
        var deleteButton = d3.select('#deleteButton');

        var isStopped = true;


        function loadPalette(paletteData) {
            palette.load({
                data: paletteData,
                checkDeleted: true,
                onInit: function() {
                    //drawing.drawPalette(palette);
                    drawing.drawBackground();
                    console.log('Initialized');
                },
                onProgress: function(percentage) {
                    drawing.showLoading(percentage);
                    console.log('Progress ' + percentage);
                },
                onComplete: function() {
                    drawing.drawPalette(palette);

                    if (palette.tagName == null) {
                        panels.showStart();
                    }
                    else if (palette.globalDiff > 0) {
                        if (palette.next_max_tag_id !== null)
                            panels.showResume();
                        else
                            panels.showInterruption();
                    }
                    else {
                        panels.showComplete();
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

        function clearPalette(pic_id, pixelGroups, sourcePixels) {
            console.log('Start');
            palette = new Palette(pic_id, pixelGroups, sourcePixels);
            console.log('Generated');
            return palette;
        }

        function deletePalette() {
            proxy.deletePalette(palette.picture_id, function() {
                window.location = '/';
            });
        }

        return function(pic_id, pixelGroups, sourcePixels) {
            var lastSave = undefined;

            clearPalette(pic_id, pixelGroups, sourcePixels);

            loadPalette(paletteData);

            var picGrabber = new PicGrabber({
                picId: pic_id,
                onPhotoLoaded: function(fragment) {
                    palette.addPhoto(fragment);

                    // !!!!!!!!!!!!!!!!!!!!
                    //if (palette.globalDiff == 0)
                    //    picGrabber.stop();
                },
                onComplete: function() {
                    drawing.drawPalette(palette);

                    if (isStopped) {
                        savePalette();

                        if (palette.globalDiff > 0) {
                            if (palette.next_max_tag_id === undefined)
                                panels.showInterruption();
                            else
                                panels.showResume();
                        }
                        else
                            panels.showComplete();
                    }
                    else {
                        console.log('Start saving');
                        savePalette(
                            function() {
                                picGrabber.start();
                            },
                            function() {
                                panels.showResume();
                            }
                        );
                    }
                },
                onEmpty: function(error) {
                    drawing.drawPalette(palette);
                    savePalette();
                    panels.showInterruption();
                    console.log('Empty feed');
                }
            });

            function startProcess() {
                isStopped = false;
                picGrabber.start();

                panels.showProcessing();
            }

            startButton.on('click', startProcess);
            resumeButton.on('click', startProcess);

            stopButton.on('click', function() {
                isStopped = true;
                panels.showSaving();
            })

            clearButton.on('click', function() {
                palette.clear();
                savePalette(function() {
                    window.location.reload();
                });
            });

            deleteButton.on('click', deletePalette);

            drawing.setZoomer(function() { return palette.groupIndex; });
        }
    });
