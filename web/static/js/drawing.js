define(['libs/d3'], function(d3) {
    function setBackground(d) {
        if (d.image !== undefined)
            return 'url(' + d.image.imageUrl + ')';
        else
            return 'none';
    }

    function setHref(d) {
        if (d.image !== undefined)
            return d.image.link;
        else
            return '#';
    }

    function drawPalette(palette) {
        d3.select('#mainPhoto')
            .classed('width' + palette.cols, true)
            .classed('height' + palette.rows, true);
            
        var photos = d3.select('#mainPhoto').selectAll('.miniPhoto')
                .data(palette.groups, function(d) {
                    return d.x + '/' + d.y;
                })
                .attr('href', setHref);

        photos.select('div')
            .style('background-image', setBackground);

        photos.enter().append('a')
            .classed('miniPhoto', true)
            .attr('href', setHref)
            .attr('target', '_blank')
            .append('div')
                .attr('row', function(d) { return d.y; })
                .attr('column', function(d) { return d.x; })
                .style('background-image', setBackground);

        photos.exit().remove();

        updateAccuracy(palette);
    }

    function updateAccuracy(palette) {
        console.log(palette.globalDiff);
        d3.select('#accuracy').text((100 * (255 - palette.globalDiff) / 255).toFixed(1));
    }

    return {
        drawPalette: drawPalette,
    }
});