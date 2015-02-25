define(['libs/d3', 'libs/instafeed', 'palette'], function(d3, instafeed, Palette) {
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
                        return 'url(' + d.image.images.thumbnail.url + ')';
                    else
                        return '';
                })
            .enter().append('div')
                .classed('miniPhoto', true)
                .attr('row', function(d) { return d.y; })
                .attr('column', function(d) { return d.x; });
        }

        function updateAccuracy(globalDiff) {
            d3.select('#accuracy').text(globalDiff);
        }

        function instagramSuccess(photos) {
            var uncomplete = photos.data.length;
            for (var i = 0; i < photos.data.length; i++) {
                var instaImage = photos.data[i];
                var canvas = document.createElement('canvas'),
                    ctx = canvas.getContext('2d');

                canvas.width = GROUP_SIZE;
                canvas.height = GROUP_SIZE;

                function imageProcessed(img, colors) {
                    if (colors.length > 0) {
                        img.color = colors;
                        var globalDiff = palette.fill(img);
                        updateAccuracy(globalDiff);
                    }
                    uncomplete--;                                
                    drawPalette();
                    if (uncomplete == 0 && !stopFlag)
                        feed.next();
                }

                var image = new Image();
                image.onload = function(instaImg) {
                    return function() {
                        var colors = [];
                        if ('naturalHeight' in this && this.naturalHeight + this.naturalWidth !== 0) {
                            ctx.drawImage(this, 0, 0, THUMBNAIL_SIZE, THUMBNAIL_SIZE, 0, 0, GROUP_SIZE, GROUP_SIZE);
                            var imgData = ctx.getImageData(0, 0, GROUP_SIZE, GROUP_SIZE);
                            for (var j = 0; j < imgData.data.length; j++)
                                if (j % 4 < 3)
                                    colors.push(imgData.data[j]);
                        }
                        imageProcessed(instaImg, colors);
                    }
                } (instaImage);

                image.onerror = function(instaImg) {
                    return function(e) {
                        console.log('Error: ' + e);
                        imageProcessed(instaImg, []);
                    }
                } (instaImage);

                image.src = IMG_URL + '?url=' + instaImage.images.thumbnail.url;
            }
        }

        function resume() {
            feed.run();
        }

        return function(accessToken, picture) {
            console.log('Start');
            palette = new Palette(picture, GROUP_SIZE);
            palette.generate();
            d3.shuffle(palette.groups);
            console.log('Generated');

            d3.select('#startButton').on('click', function() {
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
                    });
                }

                stopFlag = false;
                resume();
            })

            d3.select('#stopButton').on('click', function() {
                stopFlag = true;
            })
        }
    });