define(['libs/d3'], function(d3) {
    return function(initData) {
        d3.select('#mainPhoto').selectAll('.miniPhoto')
                .data(initData)
            .enter().append('div')
                .classed('miniPhoto', true)
                .attr('row', function(d) { return d.y; })
                .attr('column', function(d) { return d.x; })
                .style('background-image', function(d) {
                    if (d.image != null)
                        return 'url(' + d.url + ')';
                    else
                        return '';
                })
                .style('background-color', function(d) {
                    return 'rgb(' + d.color[0] + ',' + d.color[1] + ',' + d.color[2] + ')';
                });
    }
});