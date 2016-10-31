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

        function clearPalette(pic_id, pixelGroups) {
            proxy.clearPalette(palette.picture_id, function() {
                // !!!!!!!!!!!!!!!!!!!!!!
            });
        }

        function deletePalette() {
            proxy.deletePalette(palette.picture_id, function() {
                window.location = '/';
            });
        }

        return function(accessToken, pic_id, pixelGroups, paletteData) {
            // var lastSave = undefined;

            loadPalette(paletteData);

            function startProcess() {
                if (!palette.tagName)
                    palette.tagName = d3.select('#tagName').property('value');

                isStopped = false;
                picGrabber.start(palette.tagName, palette.next_max_tag_id);

                d3.select('#tagName').attr('disabled', 'disabled');
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

            drawing.setZoomer(function() { return palette.groupIndex; });
        }
    });
