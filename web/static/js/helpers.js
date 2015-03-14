define(['proxy'], function(proxy) {
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
        getImgDataColors: function(imgData) {
            var colors = [];
            for (var j = 0; j < imgData.data.length; j++)
                if (j % 4 < 3)
                    colors.push(imgData.data[j]);
            return colors;
        }
   } 
});