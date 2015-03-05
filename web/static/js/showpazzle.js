define(['palette', 'drawing'], function(Palette, drawing) {
    var GROUP_SIZE = 4,
        palette;

    return function(pic_id, picture) {
        var palette = new Palette(pic_id, picture, GROUP_SIZE);

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
    }
});