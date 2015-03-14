define([], function() {
   return function(id, imageUrl, link, username) {
        this.id = id;
        this.imageUrl = imageUrl;
        this.userName = username;
        var linkParts = link.split('/');
        this.link = linkParts[linkParts.length - 2];
        this.color = [];
   } 
});