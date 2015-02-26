define([], function() {
   return {
        loadImg: function(params) {
            // params: url, success, error

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
                params.error();
            }

            image.src = params.url;
        },
        getImgDataColors: function(imgData) {
            var colors = [];
            for (var j = imgData.data.length - 1; j >= 0; j--)
                if (j % 4 < 3)
                    colors.push(imgData.data[j]);
            return colors;
        }
   } 
});