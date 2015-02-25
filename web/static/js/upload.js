define(['libs/d3'], function(d3) {
    var uploader = d3.select('#uploader'),
        maxFileSize = 1024 * 1024;

    var holder = document.getElementById('uploader');

    return function() {
        if (window.FileReader === undefined) {
            uploader.text('Not supported'); // !!!
            uploader.classed('error', true);
            return;
        }

        uploader.node().ondragover = function() {
            uploader.classed('hover', true);
            return false;
        }


        uploader.node().ondragend = function() {
            uploader.classed('hover', false);
            return false;
        }

        uploader.node().ondrop = function(e) {
            e.preventDefault();
            uploader.classed('hover', false);
            uploader.classed('drop', true);
        };

        /*
        holder.ondrop = function (e) {
          this.className = '';
          e.preventDefault();

          var file = e.dataTransfer.files[0],
              reader = new FileReader();
          reader.onload = function (event) {
            console.log(event.target);
            holder.style.background = 'url(' + event.target.result + ') no-repeat center';
          };
          console.log(file);
          reader.readAsDataURL(file);

          return false;
        };
        */

        console.log('done');
    }
});