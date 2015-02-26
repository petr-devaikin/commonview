define(['pixel_group'], function(PixelGroup) {
    return function() {
        this.groups = [];
        this.groupIndex = {};
        this.next_max_tag_id = undefined;
        this.globalDiff = 255;

        this.generate = function(picture, groupSize) {
            this.groups = [];

            for (var i = 0; i < picture.pixels.length; i++) {
                var x = picture.pixels[i].x,
                    y = picture.pixels[i].y,
                    color = picture.pixels[i].color,
                    gX = Math.floor(x/groupSize),
                    gY = Math.floor(y/groupSize);

                if (this.groupIndex[gX] === undefined)
                    this.groupIndex[gX] = {};
                var pixelGroup = this.groupIndex[gX][gY];

                if (pixelGroup === undefined) {
                    pixelGroup = new PixelGroup(groupSize, gX, gY);
                    this.groups.push(pixelGroup);
                    this.groupIndex[gX][gY] = pixelGroup;
                }

                pixelGroup.addPixel(x % groupSize, y % groupSize, color);
            }
        }


        this.toHash = function() {
            var trueGroups = {};
            for (var i = 0; i < this.groups.length; i++) {
                var groupHash = this.groups[i].toHash();
                if (groupHash !== undefined) {
                    if (trueGroups[groupHash.x] === undefined)
                        trueGroups[groupHash.x] = {};
                    trueGroups[groupHash.x][groupHash.y] = groupHash;
                }
            }
            return {
                groups: trueGroups,
                next_max_tag_id: this.next_max_tag_id
            }
        }


        this.fromHash = function(data) {
            this.next_max_tag_id = data.next_max_tag_id;

            for (var x in data.groups)
                for (var y in data.groups[x])
                    this.groupIndex[x][y].fromHash(data.groups[x][y]);
        }


        this.fill = function(insta_image, color) {
            var freeMedia = {
                id: insta_image.id,
                imgUrl: insta_image.images.thumbnail.url,
                color: color
            }
            
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

            this.globalDiff = this.groups.reduce(function (a, b) { return a + b.diff; }, 0) / this.groups.length;
            return this.globalDiff;
        }
    }
})