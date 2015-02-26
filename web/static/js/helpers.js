define(['libs/qwest'], function(qwest) {
   return {
        loadImgByUrl: function(params) {
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

            image.src = '/img?url=' + params.url;
        },
        loadImgInfoById: function(params) {
            // params: id, success, error

            qwest.get('/imginfo', { id: params.id })
                .then(function(imgInfo) {
                    success(imgInfo.info);
                })
                .catch(function() {
                    console.log('Previously loaded image not found');
                    params.error();
                });
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