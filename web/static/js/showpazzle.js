define(['palette', 'drawing'], function(Palette, drawing) {
    return function(pic_id, picture, paletteData, exportImgUrl, groupSize) {
        var palette = new Palette(pic_id, picture, groupSize);

        palette.load({
            data: paletteData,
            exportImgUrl: exportImgUrl,
            onComplete: function() {
                if (palette.tagName) {
                    d3.select('#tagName').property('value', palette.tagName);
                    d3.select('#tagName').attr('disabled', 'disabled');
                }
                drawing.drawPalette(palette);
                console.log('Palette loaded');
            },
        });
        
        drawing.setZoomer();
    }
});