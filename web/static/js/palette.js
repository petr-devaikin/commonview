define(['pixel_group', 'helpers'], function(PixelGroup, helpers) {
    return function(picture, groupSize, thumbSize) {
        this.groups = [];
        this.groupIndex = {};
        this.next_max_tag_id = undefined;
        this.globalDiff = 255;

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


        this.fromHash = function(ctx, data) {
            this.next_max_tag_id = data.next_max_tag_id;

            for (var x in data.groups)
                for (var y in data.groups[x]) {
                    var g = this.groupIndex[x][y];
                    g.fromHash(data.groups[x][y]);

                    helpers.loadImgInfoById({
                        id: g.image.id,
                        success: function(group, palette) {
                            return function(instaImage) {
                                palette.addPhoto(ctx, instaImage, function() {}, function() {}, group);
                            }
                        } (g, this),
                        error: function(group) {
                            return function() {
                                group.image = undefined;
                            }
                        } (g),
                });
                }
        }


        this.addPhoto = function(ctx, instaImage, success, error, place) {
            helpers.loadImgByUrl({
                url: instaImage.images.thumbnail.url,
                success: function(instaImg, palette) {
                    return function(img) {
                        ctx.drawImage(img, 0, 0, thumbSize, thumbSize, 0, 0, groupSize, groupSize);
                        var imgData = ctx.getImageData(0, 0, groupSize, groupSize),
                            colors = helpers.getImgDataColors(imgData);
                        
                        var colorImage = {
                            loaded: true,
                            id: instaImage.id,
                            imgUrl: instaImage.images.thumbnail.url,
                            color: color,
                        }

                        if (place === undefined)
                            palette._findPlace(colorImage);
                        else
                            place.image = colorImage;

                        success();
                    }
                } (instaImage, this),
                error: error,
            });
        }


        this.loadAllImages = function() {

        }


        this._findPlace = function(colorImage) {
            var freeMedia = colorImage;
            
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