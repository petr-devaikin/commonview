define(['pixel_group', 'proxy', 'libs/d3', 'settings'],
    function(PixelGroup, proxy, d3, settings) {

    return function(picture_id, fragments) {
        this.picture_id = picture_id;
        this.fragments = fragments;

        var index = {}
        for (var i = 0; i < fragments.length; i++) {
            var f = fragments[i];
            if (index[f.x] === undefined)
                index[f.x] = {};
            index[f.x][f.y] = f;
        }

        this.updateFragments = function(newFragments) {
            // update just new fragments!!!!
            for (var i = 0; i < newFragments.length; i++) {
                var f = newFragments[i];
                index[f.x][f.y].lobsterId = newFragments[i].lobsterId;
                index[f.x][f.y].lobsterImg = newFragments[i].lobsterImg;
                index[f.x][f.y].lobsterUrl = newFragments[i].lobsterUrl;
            }
        }
    }
})
