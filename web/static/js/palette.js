define(['pixel_group', 'helpers', 'proxy', 'libs/d3', 'settings'],
    function(PixelGroup, helpers, proxy, d3, settings) {
    var MAX_LOADS = 20;

    return function(picture_id, picture) {
        this.picture_id = picture_id;
        this.groups = [];
        var groupIndex = {};
        this.next_max_tag_id = undefined;
        this.globalDiff = 255;
        this.tagName = undefined;


        for (var i = 0; i < picture.pixels.length; i++) {
            var x = picture.pixels[i].x,
                y = picture.pixels[i].y,
                color = picture.pixels[i].color,
                gX = Math.floor(x/settings.groupSize),
                gY = Math.floor(y/settings.groupSize);

            if (groupIndex[gX] === undefined)
                groupIndex[gX] = {};
            var pixelGroup = groupIndex[gX][gY];

            if (pixelGroup === undefined) {
                pixelGroup = new PixelGroup(gX, gY);
                this.groups.push(pixelGroup);
                groupIndex[gX][gY] = pixelGroup;
            }

            pixelGroup.addPixel(x % settings.groupSize, y % settings.groupSize, color);
        }

        d3.shuffle(this.groups);


        this._toHash = function() {
            var trueGroups = [];
            for (var i = 0; i < this.groups.length; i++)
                if (this.groups[i].image)
                    trueGroups.push({
                        x: this.groups[i].x,
                        y: this.groups[i].y,
                        id: this.groups[i].image.id,
                        diff: this.groups[i].image.diff
                    });
            return {
                groups: trueGroups,
                globalDiff: this.globalDiff,
                tagName: this.tagName,
                next_max_tag_id: this.next_max_tag_id,
            }
        }


        this.load = function(params) {
            // params: checkDeleted, onComplete, onInit, onProgress, exportImgUrl
            var completed = false;

            var data = params.data;
            this.next_max_tag_id = data.next_max_tag_id;
            this.globalDiff = data.globalDiff;
            this.tagName = data.tagName;

            var maxCounter = 0,
                queue = [];

            function processNext() {
                var picsLeft = queue.length;

                if (picsLeft > 0 && picsLeft % 10 == 0 && params.onProgress !== undefined)
                    params.onProgress(100 * (maxCounter - picsLeft) / maxCounter);

                if (!completed && picsLeft == 0) {
                    completed = true;
                    if (params.onComplete !== undefined) params.onComplete();
                }

                if (picsLeft > 0) {
                    var group = queue.pop();
                    helpers.loadImgByUrl({
                        url: group.image.instaImg,
                        useProxy: false,
                        success: function(img) {
                            group.loading = false;
                            processNext();
                        },
                        error: function() {
                            console.log('Old photo not found');
                            group.loading = false;
                            group.image = undefined;
                            processNext();
                        }
                    });
                }
            }

            for (var x in data.groups)
                for (var y in data.groups[x]) {
                    var g = groupIndex[x][y];
                    g.loading = true;
                    g.fromHash(data.groups[x][y]);

                    if (params.checkDeleted) {
                        maxCounter++;

                        queue.push(g);
                        if (maxCounter <= MAX_LOADS)
                            processNext();
                    }
                }

            if (maxCounter == 0 && params.onComplete !== undefined)
                params.onComplete();

            if (params.onInit !== undefined) params.onInit();
        }


        this.save = function(params) {
            // params: onSuccess, onError
            var hash = JSON.stringify(this._toHash());
            proxy.savePalette(
                this.picture_id,
                hash,
                params.onSuccess,
                params.onError
            );
        }


        this.addPhoto = function(newImage) {
            var freeImage = newImage;
            
            for (var i = 0; i < this.groups.length; i++) {
                var g = this.groups[i];
                if (g.loading)
                    continue;

                var diff = g.calcDiff(freeImage.lowPic);

                if (g.image === undefined || g.image.diff > diff) {
                    if (g.image !== undefined) {
                        var tmp = g.image;
                        g.image = freeImage;
                        g.image.diff = diff;
                        freeImage = tmp;
                    }
                    else {
                        g.image = freeImage;
                        g.image.diff = diff;
                        break;
                    }
                }
            }

            this.calcDiff();
        }

        this.calcDiff = function() {
            this.globalDiff = this.groups.reduce(
                function (a, b) {
                    return a + (b.image ? b.image.diff : 255);
                },
                0
            ) / this.groups.length;
        }
    }
})