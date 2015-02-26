define(['libs/d3', 'libs/instafeed', 'palette', 'helpers'], function(d3, instafeed, Palette, helpers) {
        var GROUP_SIZE = 4,
            THUMBNAIL_SIZE = 150;

        var palette,
            feed = undefined,
            stopFlag = true;

        function drawPalette() {
            d3.select('#mainPhoto').selectAll('.miniPhoto')
                .data(palette.groups, function(d) { return d.x + '/' + d.y; })
                .style('background-image', function(d) {
                    if (d.image !== undefined && d.image.loaded)
                        return 'url(' + d.image.imgUrl + ')';
                    else
                        return '';
                })
            .enter().append('div')
                .classed('miniPhoto', true)
                .attr('row', function(d) { return d.y; })
                .attr('column', function(d) { return d.x; })
                .style('background-image', function(d) {
                    if (d.image !== undefined && d.image.loaded)
                        return 'url(' + d.image.imgUrl + ')';
                    else
                        return 'none';
                });

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


                var colorImage = {
                    loaded: false,   // image is not loaded and color is not calculated
                    id: instaImage.id,
                    imgUrl: instaImage.images.thumbnail.url,
                    color: [],
                }

                palette.addPhoto(colorImage, imageProcessed, imageFailed);
            }
        }

        return function(accessToken, picture, max_tag_id) {
            console.log('Start');
            palette = new Palette(picture, GROUP_SIZE, THUMBNAIL_SIZE);
            d3.shuffle(palette.groups);
            console.log('Generated');

            d3.select('#startButton').on('click', function() {
                stopFlag = false;
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
                        before: function() {
                            if (max_tag_id !== undefined) {
                                var oldUrl = this._buildUrl();
                                this._buildUrl = function() {
                                    return oldUrl + '&max_tag_id=' + max_tag_id;
                                }
                            }
                        }
                    });

                    feed.run();
                }
                else {
                    palette = new Palette(picture, GROUP_SIZE, THUMBNAIL_SIZE);
                    d3.shuffle(palette.groups);
                    //drawPalette();
                    palette.fromHash(accessToken, hash, drawPalette);
                    feed.next();
                }
            })

            var hash; 

            d3.select('#stopButton').on('click', function() {
                stopFlag = true;
                hash = palette.toHash();
                console.log(hash);
                //drawPalette();
                //console.log(JSON.stringify(palette.toHash()).length);
            })
        }
    });