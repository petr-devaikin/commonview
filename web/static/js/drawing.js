define(['libs/d3', 'settings'], function(d3, settings) {
    function setZoomer() {
        var zoom = d3.select('#zoom');

        window.addEventListener('mousemove', function(e) {
            var photoBounds = document.getElementById('mainPhoto').getBoundingClientRect();
            if (e.x >= photoBounds.left && e.x  <= photoBounds.right &&
                e.y >= photoBounds.top && e.y  <= photoBounds.bottom) {

                var photoX = Math.floor((e.x - photoBounds.left) / settings.miniPhotoSize),
                    photoY = Math.floor((e.y - photoBounds.top) / settings.miniPhotoSize);

                var photo = d3.select('.miniPhoto[column=\'' + photoX + '\'][row=\'' + photoY + '\']');
                if (!photo.empty() && photo.datum().image !== undefined) {
                    zoom
                        .style('display', 'block')
                        .style('background', setBackground(photo.datum()))
                        .style('left', e.pageX + 'px')
                        .style('top', e.pageY + 'px');

                    zoom.select('#username').text('@' + photo.datum().image.userName);
                }
                else {
                    zoom.style('display', null);
                }
            }
            else
                zoom.style('display', null);
        })
    }

    function setBackground(d) {
        return d.image ? 'url(' + d.image.imageUrl + ')' : 'none';
    }

    function setHref(d) {
        return d.image ? 'https://instagram.com/p/' + d.image.link + '/' : '#';
    }

    function setDisplay(d) {
        return d.image ? null : 'none';
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
        console.log(v);
        d3.selectAll('.accuracyPercentage')
            .text(v.toFixed(1) + '%')
            .style('color', 'hsl(' + (120 * v / 100) + ', 50%, 60%)');
    }

    function showLoading(percentage) {
        d3.select('#loadingPercentage').text(percentage.toFixed(1) + '%');
    }

    return {
        drawPalette: drawPalette,
        showLoading: showLoading,
        setZoomer: setZoomer,
    }
});