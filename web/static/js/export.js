define(['helpers'], function(helpers) {
    return function(groupSize, palette, picSize) {
        var mainImage = document.getElementById('mainPhoto'),
            width = mainImage.offsetWidth,
            height = mainImage.offsetHeight;

        var canvas = document.getElementById('result'),
            ctx = canvas.getContext('2d');

        canvas.width = width * picSize;
        canvas.height = height * picSize;

        var queue = [];

        function imageProcessed(g) {
            return function(img) {
                ctx.drawImage(img, 0, 0, img.width, img.height,
                    g.x * picSize, g.y * picSize, picSize, picSize);

                console.log(count);
                processImage();
            }
        }

        function processImage() {
            if (queue.length > 0) {
                var group = queue.pop();
                helpers.loadImgByUrl({
                    url: group.image.imageUrl,
                    success: imageProcessed(group),
                    error: imageProcessed(group),
                });
            }
            else {
                var link = document.getElementById('downloader');
                link.href = canvas.toDataURL();
                link.download = 'pazzla.png';
                console.log('Export done');
                link.click();
            }
        }

        for (var i = 0; i < palette.groups.length; i++) {
            var group = palette.groups[i];
            if (group.image) {
                queue.push(group);                
            }
        }
    }
})