define(['libs/d3', 'settings'], function(d3, settings) {
    function setZoomer(getPalette, mobile) {
        var zoom = d3.select('#zoom');

        function moveHandler(e) {
            return;
            var photoBounds = document.getElementById('mainPhoto').getBoundingClientRect();

            var x = e.clientX,
                y = e.clientY;


            if (mobile && e.touches.length == 1){ // Only deal with one finger
                var touch = e.touches[0]; // Get the information for finger #1
                x = touch.clientX;
                y = touch.clientY;
            }

            var zoomX = x + (document.documentElement.scrollLeft || document.body.scrollLeft),
                zoomY = y + (document.documentElement.scrollTop || document.body.scrollTop);

            if (mobile && e.touches.length == 1){ // Only deal with one finger
                zoomX += 10;
                zoomY -= 10;
            }

            if (x >= photoBounds.left && x  <= photoBounds.right &&
                y >= photoBounds.top && y  <= photoBounds.bottom) {
                var photoX = Math.floor((x - photoBounds.left) / settings.miniPhotoSize),
                    photoY = Math.floor((y - photoBounds.top) / settings.miniPhotoSize);

                var groupIndex = getPalette();

                if (groupIndex[photoX] && groupIndex[photoX][photoY] &&
                    groupIndex[photoX][photoY].image !== undefined) {
                    var datum = groupIndex[photoX][photoY];
                    zoom
                        .style('display', 'block')
                        .style('background', setZoomerBackground(datum))
                        .style('left', zoomX + 'px')
                        .style('top', zoomY + 'px');

                    zoom.select('#username').text('@' + datum.image.instaUser);
                }
                else {
                    zoom.style('display', null);
                }
            }
            else
                zoom.style('display', null);
        }

        if (!mobile)
            window.addEventListener('mousemove', moveHandler);
        else {
            window.addEventListener('touchmove', moveHandler);
            window.addEventListener('touchstart', moveHandler);
            window.addEventListener('touchend', function() {
                zoom.style('display', null);
            });
        }
    }

    function setZoomerBackground(d) {
        return 'url(' + d.image.instaImg + ')';
    }

    function setBackground(d) {
        return d.isSet ? 'url(' + d.lobsterImg + ')' : 'none';
    }

    function setHref(d) {
        return d.isSet ? d.lobsterUrl : '#';
    }

    function setDisplay(d) {
        return d.isSet ? null : 'none';
    }

    function drawBackground() {
        var src = d3.select('#mainBackground').attr('url');
        d3.select('#mainBackground').style('background-image', 'url(' + src + '?d=' + (new Date()).getTime() + ')');
    }

    function drawPalette(palette) {
        var photos = d3.select('#mainPhoto').selectAll('.miniPhoto').data(palette.fragments, function(d) { return d.x + '-' + d.y; })
                .style('background-image', setBackground);

        photos.selectAll('a')
            .attr('href', setHref)
            .style('display', setDisplay);

        var newPhotos = photos.enter().append('div')
            .classed('miniPhoto', true)
            .attr('row', function(d) { return d.y; })
            .attr('column', function(d) { return d.x; })
            .style('background-image', setBackground)
            .append('a')
                .attr('href', setHref)
                .style('display', setDisplay)
                .attr('target', '_blank');

        photos.exit().remove();
    }

    function updateAccuracy(v) {
        //var v = palette.globalDiff ? (100 * Math.pow((255 - palette.globalDiff) / 255, 2)) : 0;
        console.log('Accurancy: ' + v);
        d3.selectAll('.accuracyPercentage')
            .text(v.toFixed(1) + '%')
            .style('color', 'hsl(' + (120 * v / 100) + ', 50%, 60%)');
    }

    return {
        drawPalette: drawPalette,
        setZoomer: setZoomer,
        drawBackground: drawBackground,
        updateAccuracy: updateAccuracy
    }
});
