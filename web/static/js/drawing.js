define(['libs/d3', 'settings'], function(d3, settings) {
    function setZoomer(getPalette) {
        var zoom = d3.select('#zoom');

        window.addEventListener('mousemove', function(e) {
            var photoBounds = document.getElementById('mainPhoto').getBoundingClientRect();

            var x = e.clientX,
                y = e.clientY,
                zoomX = e.clientX + (document.documentElement.scrollLeft || document.body.scrollLeft),
                zoomY = e.clientY + (document.documentElement.scrollTop || document.body.scrollTop);

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
                        .style('background-image', setZoomerBackground(datum))
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
        })
    }

    function setZoomerBackground(d) {
        return 'url(' + d.image.instaImg + ')';
    }

    function setBackground(d) {
        return d.image && d.changed ? 'url(' + d.image.instaImg + ')' : 'none';
    }

    function setHref(d) {
        return d.image ? 'https://lobster.media/content/' + d.image.instaUrl + '/' : '#';
    }

    function setDisplay(d) {
        return d.image ? null : 'none';
    }

    function drawBackground() {
        var src = d3.select('#mainBackground').attr('url');
        d3.select('#mainBackground').style('background-image', 'url(' + src + '?d=' + (new Date()).getTime() + ')');
    }

    function drawPalette(palette) {
        var photos = d3.select('#mainPhoto').selectAll('.miniPhoto').data(palette.groups)
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

        updateAccuracy(palette);
    }

    function updateAccuracy(palette) {
        var v = palette.globalDiff ? (100 * (255 - palette.globalDiff) / 255) : 0;
        console.log('Accurancy: ' + v);
        d3.selectAll('.accuracyPercentage')
            .text(v.toFixed(1) + '%')
            .style('color', 'hsl(' + (120 * v / 100) + ', 50%, 60%)');
    }

    function showLoading(percentage) {
        d3.select('#loadingPercentage').text(percentage.toFixed(0) + '%');
    }

    return {
        drawPalette: drawPalette,
        showLoading: showLoading,
        setZoomer: setZoomer,
        drawBackground: drawBackground,
    }
});
