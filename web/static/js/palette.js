define(['pixel_group', 'proxy', 'libs/d3', 'settings'],
    function(PixelGroup, proxy, d3, settings) {

    return function(picture_id, pixelGroups, sourcePixels) {
        this.picture_id = picture_id;
        this.groups = [];
        this.groupIndex = {};
        this.next_max_tag_id = undefined;
        this.globalDiff = 255;
        this.tagName = undefined;

        var updatedGroups = [];
        var removedPictures = [];


        for (var i = 0; i < sourcePixels.length; i++) {
            var x = sourcePixels[i].x,
                y = sourcePixels[i].y,
                color = sourcePixels[i].color,
                gX = Math.floor(x/settings.groupSize),
                gY = Math.floor(y/settings.groupSize);

            if (this.groupIndex[gX] === undefined)
                this.groupIndex[gX] = {};
            var pixelGroup = this.groupIndex[gX][gY];

            if (pixelGroup === undefined) {
                pixelGroup = new PixelGroup(gX, gY);
                this.groups.push(pixelGroup);
                this.groupIndex[gX][gY] = pixelGroup;
            }

            pixelGroup.addPixel(x % settings.groupSize, y % settings.groupSize, color);
        }

        d3.shuffle(this.groups);


        this.load = function(params) {
            // params: data, checkDeleted, onComplete, onInit, onProgress, exportImgUrl
            var completed = false;

            var data = params.data;

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
                    proxy.loadRemoteImage({
                        url: group.image.imageUrl,
                        success: function(img) {
                            group.loading = false;
                            processNext();
                        },
                        error: function() {
                            console.log('Old photo not found'); // Do something with this fragment!
                            group.loading = false;
                            group.image = undefined;
                            processNext();
                        }
                    });
                }
            }

            for (var i = 0; i < pixelGroups.length; i++) {
                var group = pixelGroups[i];
                var g = this.groupIndex[group.x][group.y];

                g.loading = true;
                g.setImage(group);

                if (params.checkDeleted) {
                    maxCounter++;

                    queue.push(g);
                    if (maxCounter <= settings.maxLoads)
                        processNext();
                }
            }

            if (maxCounter == 0 && params.onComplete !== undefined)
                params.onComplete();

            if (params.onInit !== undefined) params.onInit();
        }


        this._toHash = function() {
            var trueGroups = [];
            for (var i = 0; i < updatedGroups.length; i++) {
                trueGroups.push({
                    x: updatedGroups[i].x,
                    y: updatedGroups[i].y,
                    id: updatedGroups[i].image.id,
                    diff: updatedGroups[i].image.diff
                });
            }

            return {
                updatedGroups: trueGroups,
                removedPicrures: removedPictures,
            }
        }


        this.save = function(params) {
            // params: onSuccess, onError
            var hash = JSON.stringify(this._toHash());
            proxy.savePalette(
                this.picture_id,
                hash,
                function(args) {
                    updatedGroups = [];
                    removedPictures = [];
                    params.onSuccess(args);
                },
                params.onError
            );
        }


        this.clear = function() {
            removedPictures = 'all';
        }


        this.addPhoto = function(newFragment) {
            var freeFragment = newFragment;

            for (var i = 0; i < this.groups.length; i++) {
                var g = this.groups[i];
                if (g.loading)
                    continue;

                var diff = g.calcDiff(freeFragment.lowPic);

                if (g.image === undefined || g.image.diff > diff) {
                    g.changed = true;
                    if (updatedGroups.indexOf(g) == -1)
                        updatedGroups.push(g);

                    if (g.image !== undefined) {
                        var tmp = g.image;
                        g.image = freeImage;
                        g.image.diff = diff;
                        freeImage = tmp;
                    }
                    else {
                        g.image = freeImage;
                        g.image.diff = diff;
                        freeImage = undefined;
                        break;
                    }
                }
            }

            if (freeImage !== undefined) {
                removedPictures.push(freeImage.id);
            }
        }
    }
})
