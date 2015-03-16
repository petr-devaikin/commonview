define(['proxy', 'settings'], function(proxy, settings) {
    var canvas = document.createElement('canvas'),
        ctx = canvas.getContext('2d');

    canvas.width = settings.exportPhotoSize;
    canvas.height = settings.exportPhotoSize;


    function RGBfromRGBA(imgData) {
        var colors = [];
        for (var j = 0; j < imgData.data.length; j++)
            if (j % 4 < 3)
                colors.push(imgData.data[j]);
        return colors;
    }

    return {
        loadImgByUrl: function(params) {
            // params: url, success, error

            var _useProxy = params.useProxy !== undefined ? params.useProxy : true;

            var image = new Image();

            image.onload = function() {
                if ('naturalHeight' in this && this.naturalHeight + this.naturalWidth !== 0)
                    params.success(this);
                else {
                    console.log('Error: empty image');
                    params.error();
                }
            }

            image.onerror = function(e) {
                console.log('Error: ' + e);
                if (params.error !== undefined) params.error();
            }

            image.src = _useProxy ? proxy.getImageUrl(params.url) : params.url;
        },
        
        getImgDataColorsFromImage: function(img, groupSize) {
            ctx.drawImage(img, 0, 0, img.width, img.height,
                               0, 0, groupSize, groupSize);
            var imgData = ctx.getImageData(0, 0, groupSize, groupSize); 
            return RGBfromRGBA(imgData);
        },
        getImgDataColorsFromCanvas: function(exportCtx, x, y) {
            var data = exportCtx.getImageData(x * settings.exportPhotoSize,
                                              y * settings.exportPhotoSize,
                                              settings.exportPhotoSize,
                                              settings.exportPhotoSize);
            return RGBfromRGBA(data);
        },

        getExportFragmentFromImage: function(img) {
            ctx.drawImage(img, 0, 0, img.width, img.height,
                               0, 0, settings.exportPhotoSize, settings.exportPhotoSize);
            return ctx.getImageData(0, 0, settings.exportPhotoSize, settings.exportPhotoSize); 
        },
        getExportFragment: function(exportCtx, x, y) {
            return exportCtx.getImageData(x * settings.exportPhotoSize,
                                          y * settings.exportPhotoSize,
                                          settings.exportPhotoSize,
                                          settings.exportPhotoSize);
        },

        drawExportFragment: function(ctx, x, y, data) {
            ctx.putImageData(data, x * settings.exportPhotoSize, y * settings.exportPhotoSize);
        },
    } 
});