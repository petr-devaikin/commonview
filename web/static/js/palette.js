define(['pixel_group', 'proxy', 'libs/d3', 'settings'],
    function(PixelGroup, proxy, d3, settings) {

    return function(picture_id, pixelGroups) {
        this.picture_id = picture_id;
        this.groups = [];
        this.groupIndex = {};
        this.next_max_tag_id = undefined;
        this.globalDiff = 255;
        this.tagName = undefined;

        var updatedGroups = [];
        var removedPictures = [];


        for (var i = 0; i < pixelGroups.length; i++) {
            var pixelGroup = new PixelGroup(pixelGroups[i]);

            var gX = pixelGroups[i].x,
                gY = pixelGroups[i].y;

            if (this.groupIndex[gX] === undefined)
                this.groupIndex[gX] = {};
            this.groupIndex[gX][gY] = pixelGroup;
            this.groups.push(pixelGroup);
        }

        d3.shuffle(this.groups);


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
                    proxy.loadRemoteImage({
                        url: group.image.instaImg,
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

            for (var i = 0; i < data.groups.length; i++) {
                var group = data.groups[i];
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
                globalDiff: this.globalDiff,
                tagName: this.tagName,
                next_max_tag_id: this.next_max_tag_id,
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
            this.next_max_tag_id = undefined;
            this.globalDiff = 255;
            this.tagName = undefined;
        }


        this.addPhoto = function(newImage) {
            var freeImage = newImage;
            
            for (var i = 0; i < this.groups.length; i++) {
                var g = this.groups[i];
                if (g.loading)
                    continue;

                var diff = g.calcDiff(freeImage.lowPic);

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

            if (freeImage !== undefined)
                removedPictures.push(freeImage.id);

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