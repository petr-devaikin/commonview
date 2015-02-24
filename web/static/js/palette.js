define(['pixel_group'], function(PixelGroup) {
    var PIX_PER_IMAGE = 4;

    return function(picture) {
        this.picture = picture;
        this.groups = [];

        this.generate = function() {
            this.groups = [];

            for (var i = 0; i < this.picture.pixels.length; i++) {
                var x = this.picture.pixels[i].x,
                    y = this.picture.pixels[i].y,
                    color = this.picture.pixels[i].color,
                    gX = Math.floor(x/PIX_PER_IMAGE),
                    gY = Math.floor(y/PIX_PER_IMAGE);

                var pixelGroup = this.groups.filter(function(el) {
                    return el.x == gX && el.y == gY;
                });
                if (pixelGroup.length == 0) {
                    pixelGroup = new PixelGroup(gX, gY, PIX_PER_IMAGE);
                    this.groups.push(pixelGroup);
                }
                else
                    pixelGroup = pixelGroup[0];

                pixelGroup.addPixel(x % PIX_PER_IMAGE, y % PIX_PER_IMAGE, color);
            }
        }

        this.fill = function(insta_image) {
            var currentlyFound = 0;
            var freeMedia = insta_image;
            
            for (var i = 0; i < this.groups.length; i++) {
                var g = this.groups[i],
                    diff = g.calcDiff(freeMedia.color);

                if (g.diff > diff) {
                    currentlyFound++;
                    if (g.image !== undefined) {
                        var tmp = g.image;
                        g.image = freeMedia;
                        g.diff = diff;
                        freeMedia = tmp;
                        console.log('((');
                    }
                    else {
                        g.image = freeMedia;
                        g.diff = diff;
                        console.log('!!');
                        break;
                    }
                }
            }

            var globalDiff = this.groups.reduce(function (a, b) { return a + b.diff; }, 0) / this.groups.length;
            console.log('Currently found: ' + currentlyFound);
            console.log('Global diff: ' + globalDiff);
            return globalDiff;
        }
    }
})