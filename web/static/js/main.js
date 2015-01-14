define(['libs/d3'], function(d3) {
    return function(initData) {
        d3.select('#mainPhoto').selectAll('.miniPhoto')
                .data(initData)
            .enter().append('div')
                .classed('miniPhoto', true)
                .attr('row', function(d) { return d.y; })
                .attr('column', function(d) { return d.x; })
                .style('background', function(d) { return d.color; });
    }
});