define(['pixel_group'], function(PixelGroup) {
    return function() {
        this.groups = [];
        this.next_max_tag_id = undefined;

        this.generate = function(picture, groupSize) {
            this.groups = [];

            for (var i = 0; i < picture.pixels.length; i++) {
                var x = picture.pixels[i].x,
                    y = picture.pixels[i].y,
                    color = picture.pixels[i].color,
                    gX = Math.floor(x/groupSize),
                    gY = Math.floor(y/groupSize);

                var pixelGroup = this.groups.filter(function(el) {
                    return el.x == gX && el.y == gY;
                });
                if (pixelGroup.length == 0) {
                    pixelGroup = new PixelGroup(gX, gY, groupSize);
                    this.groups.push(pixelGroup);
                }
                else
                    pixelGroup = pixelGroup[0];

                pixelGroup.addPixel(x % groupSize, y % groupSize, color);
            }
        }

        this.fill = function(insta_image) {
            var freeMedia = insta_image;
            
            for (var i = 0; i < this.groups.length; i++) {
                var g = this.groups[i],
                    diff = g.calcDiff(freeMedia.color);

                if (g.diff > diff) {
                    if (g.image !== undefined) {
                        var tmp = g.image;
                        g.image = freeMedia;
                        g.diff = diff;
                        freeMedia = tmp;
                    }
                    else {
                        g.image = freeMedia;
                        g.diff = diff;
                        break;
                    }
                }
            }

            var globalDiff = this.groups.reduce(function (a, b) { return a + b.diff; }, 0) / this.groups.length;
            return globalDiff;
        }
    }
})