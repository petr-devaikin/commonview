define(['palette', 'drawing'], function(Palette, drawing) {
    return function(pic_id, picture, paletteData, exportImgUrl, mobile) {
        var palette = new Palette(pic_id, picture);

        palette.load({
            data: paletteData,
            exportImgUrl: exportImgUrl,
            onComplete: function() {
                if (!mobile)
                    drawing.drawPalette(palette);
                console.log('Palette loaded');
            },
        });
        
        drawing.drawBackground();
        drawing.setZoomer(function() { return palette.groupIndex; }, mobile);
    }
});