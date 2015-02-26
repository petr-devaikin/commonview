define(['pixel_group', 'helpers'], function(PixelGroup, helpers) {
    return function(picture, groupSize, thumbSize) {
        this.groups = [];
        this.groupIndex = {};
        this.next_max_tag_id = undefined;
        this.globalDiff = 255;

        var canvas = document.createElement('canvas'),
            ctx = canvas.getContext('2d');

        canvas.width = groupSize;
        canvas.height = groupSize;

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


        this.fromHash = function(accessToken, data) {
            this.next_max_tag_id = data.next_max_tag_id;

            for (var x in data.groups)
                for (var y in data.groups[x]) {
                    var g = this.groupIndex[x][y];
                    g.loading = true;
                    g.fromHash(data.groups[x][y]);

                    this.addPhoto(g.image, false,
                        function(group) {
                            return function() {
                                console.log('Old photo loaded');
                                group.loading = false;
                            }
                        } (g),
                        function(group) {
                            return function() {
                                console.log('Old photo not found');
                                group.loading = false;
                                group.image = undefined;
                            }
                        } (g)
                    );
                }
        }


        this.addPhoto = function(colorImage, findPlace, success, error) {
            var palette = this;
            helpers.loadImgByUrl({
                url: colorImage.imgUrl,
                success: function(img) {
                    ctx.drawImage(img, 0, 0, thumbSize, thumbSize, 0, 0, groupSize, groupSize);
                    var imgData = ctx.getImageData(0, 0, groupSize, groupSize),
                        colors = helpers.getImgDataColors(imgData);
                    
                    colorImage.color = colors;

                    if (findPlace)
                        palette._findPlace(colorImage);

                    palette.globalDiff = palette.groups.reduce(function (a, b) {return a + b.diff; }, 0) / palette.groups.length;

                    success();
                },
                error: error,
            });
        }


        this._findPlace = function(colorImage) {
            var freeMedia = colorImage;
            
            for (var i = 0; i < this.groups.length; i++) {
                var g = this.groups[i];
                if (g.loading)
                    continue;

                var diff = g.calcDiff(freeMedia.color);

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
        }
    }
})