define(['palette', 'drawing'], function(Palette, drawing) {
    return function(pic_id, picture, groupSize) {
        var palette = new Palette(pic_id, picture, groupSize);

        palette.load({
            onComplete: function() {
                if (palette.tagName) {
                    d3.select('#tagName').property('value', palette.tagName);
                    d3.select('#tagName').attr('disabled', 'disabled');
                }
                drawing.drawPalette(palette);
                console.log('Palette loaded');
            },
            onError: function() {
                console.log('Palette loading error');
            }
        });
        
        drawing.setZoomer();
    }
});