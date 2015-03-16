define(['pixel_group', 'helpers', 'proxy', 'libs/d3'], function(PixelGroup, helpers, proxy) {
    var MAX_LOADS = 20;

    return function(picture_id, picture, groupSize) {
        this.picture_id = picture_id;
        this.groups = [];
        var groupIndex = {};
        this.next_max_tag_id = undefined;
        this.globalDiff = 255;
        this.tagName = undefined;

        var exportCanvas = document.getElementById('exportCanvas'),
            exportCtx = exportCanvas.getContext('2d');


        for (var i = 0; i < picture.pixels.length; i++) {
            var x = picture.pixels[i].x,
                y = picture.pixels[i].y,
                color = picture.pixels[i].color,
                gX = Math.floor(x/groupSize),
                gY = Math.floor(y/groupSize);

            if (groupIndex[gX] === undefined)
                groupIndex[gX] = {};
            var pixelGroup = groupIndex[gX][gY];

            if (pixelGroup === undefined) {
                pixelGroup = new PixelGroup(groupSize, gX, gY);
                this.groups.push(pixelGroup);
                groupIndex[gX][gY] = pixelGroup;
            }

            pixelGroup.addPixel(x % groupSize, y % groupSize, color);
        }

        d3.shuffle(this.groups);


        this._toHash = function() {
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
                globalDiff: this.globalDiff,
                tagName: this.tagName,
                next_max_tag_id: this.next_max_tag_id,
                export: exportCanvas.toDataURL(),
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
                        url: group.image.imageUrl,
                        useProxy: false,
                        success: function(img) {
                            //console.log('Old photo loaded');
                            group.loading = false;
                            processNext();
                        },
                        error: function() {
                            console.log('Old photo not found');
                            group.loading = false;
                            //group.diff = 255;
                            group.image = undefined;
                            processNext();
                        }
                    });
                }
            }


            var exportImage = new Image();
            exportImage.src = params.exportImgUrl;
            exportImage.onload = function() {
                exportCtx.drawImage(exportImage, 0, 0);

                for (var x in data.groups)
                    for (var y in data.groups[x]) {
                        var g = groupIndex[x][y];
                        g.loading = true;
                        g.fromHash(data.groups[x][y]);

                        if (params.checkDeleted) {
                            g.color = helpers.getImgDataColorsFromCanvas(exportCtx, x, y);
                            maxCounter++;

                            queue.push(g);
                            if (maxCounter <= MAX_LOADS)
                                processNext();
                        }
                    }

                if (maxCounter == 0 && params.onComplete !== undefined)
                    params.onComplete();
            }

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


        this.addPhoto = function(colorImage) {
            var freeMedia = colorImage;
            
            for (var i = 0; i < this.groups.length; i++) {
                var g = this.groups[i];
                if (g.loading)
                    continue;

                var diff = g.calcDiff(freeMedia.color);

                if (g.diff > diff || g.image === undefined) {
                    if (g.image !== undefined) {
                        var tmp = g.image;
                        g.image = freeMedia;
                        g.diff = diff;
                        freeMedia = tmp;
                        freeMedia.exportData = helpers.getExportFragment(exportCtx, g.x, g.y);

                        helpers.drawExportFragment(exportCtx, g.x, g.y, g.image.exportData);
                        g.image.exportData = undefined;
                    }
                    else {
                        g.image = freeMedia;
                        g.diff = diff;

                        helpers.drawExportFragment(exportCtx, g.x, g.y, g.image.exportData);
                        g.image.exportData = undefined;
                        break;
                    }
                }
            }

            this.globalDiff = this.groups.reduce(function (a, b) {return a + b.diff; }, 0) / this.groups.length;
        }
    }
})