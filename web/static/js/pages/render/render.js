define(['libs/d3', 'palette', 'proxy', 'drawing', './panels'],
    function(d3, Palette, proxy, drawing, panels) {
        var palette;

        var startButton = d3.select('#startButton');
        var resumeButton = d3.select('#resumeButton');
        var stopButton = d3.select('#pauseButton');
        var deleteButton = d3.select('#deleteButton');

        var isStopped = true;

        function deletePalette() {
            proxy.deletePalette(palette.picture_id, function() {
                window.location = '/';
            });
        }

        return function(pic_id, fragments) {
            // var lastSave = undefined;
            palette = new Palette(pic_id, fragments);
            //drawing.drawBackground();
            drawing.drawPalette(palette);

            function startProcess() {
                console.log('Start!');
                isStopped = false;
                proxy.loadNewImages(
                    pic_id,
                    function(response) {
                        if (response.result == 'done') {
                            panels.showComplete();
                        }
                        else if (response.result == 'processing') {
                            palette.updateFragments(response.fragments);
                            drawing.drawPalette(palette);
                            console.log('3');
                            if (!isStopped) {
                                console.log('start again');
                                startProcess();
                            }
                        }
                    },
                    function() {

                    });
                panels.showProcessing();
            }

            startButton.on('click', startProcess);
            resumeButton.on('click', startProcess);

            stopButton.on('click', function() {
                isStopped = true;
                panels.showResume();
            });

            deleteButton.on('click', deletePalette);

            drawing.setZoomer(function() { return palette.groupIndex; });

            panels.showStart();
        }
    });
