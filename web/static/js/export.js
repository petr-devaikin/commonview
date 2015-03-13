define(['helpers'], function(helpers) {
    return function(groupSize, palette, picSize) {
        var mainImage = document.getElementById('mainPhoto'),
            width = mainImage.offsetWidth,
            height = mainImage.offsetHeight;

        var canvas = document.getElementById('result'),
            ctx = canvas.getContext('2d');

        canvas.width = width / groupSize * picSize;
        canvas.height = height / groupSize * picSize;

        var count = 0;

        for (var i = 0; i < palette.groups.length; i++) {
            var group = palette.groups[i];
            if (group.image) {
                count++;
                helpers.loadImgByUrl({
                    url: group.image.imageUrl,
                    success: function(g) {
                        return function(img) {
                            ctx.drawImage(img, 0, 0, img.width, img.height,
                                g.x * picSize, g.y * picSize, picSize, picSize);

                            console.log(count);
                            if (--count == 0) {
                                var link = document.getElementById('downloader');
                                link.href = canvas.toDataURL();
                                link.download = 'pazzla.png';
                                console.log('Export done');
                                link.click();
                            }
                        }
                    } (group)
                });
            }
        }
    }
})