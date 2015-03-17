define(['helpers'], function(helpers) {
   return function(id, imageUrl, link, username) {
        this.id = id;
        this.imageUrl = imageUrl;
        this.userName = username;

        var linkParts = link.split('/');
        if (linkParts.length > 1)
            this.link = linkParts[linkParts.length - 2];
        else
            this.link = link;

        this.color = [];
        this.exportData = undefined;

        this.toHash = function() {
            return {
                id: this.id,
                imageUrl: this.imageUrl,
                userName: this.userName,
                link: this.link,
                exportData: helpers.RGBfromRGBA(this.exportData),
            }
        }
   } 
});