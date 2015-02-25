define(['libs/d3', 'libs/qwest'], function(d3, qwest) {
    var uploader = d3.select('#uploader'),
        maxFileSize = 1024 * 1024,
        allowedFileTypes = ['image/png', 'image/jpeg', 'image/gif'],
        UPLOAD_URL = '/upload';

    var holder = document.getElementById('uploader');

    function setError(text) {
        uploader.classed('hover', false);
        uploader.classed('drop', false);
        uploader.classed('error', true);

        uploader.text(text);
    }

    return function() {
        if (window.FileReader === undefined) {
            setText('Not supported!'); // !!!
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

            var file = event.dataTransfer.files[0];

            if (file.size > maxFileSize) {
                setError('Too big file!');
                return false;
            }

            if (allowedFileTypes.indexOf(file.type) == -1) {
                setError('Wrong file type!');
                return false;
            }

            var data = new FormData();
            data.append('pic', file);

            qwest.before(function() {
                     this.uploadonprogress = function(e) {
                         var percent = parseInt(event.loaded / event.total * 100);
                         console.log('Uploaded: ' + percent);
                     };
                 })
                 .post(UPLOAD_URL, data, { dataType: 'formdata' })
                 .then(function(res) {
                     window.location = res.url;
                 })
                 .catch(function(message) {
                     setError('Error while uploading!');
                     console.log(message);
                 });

        }
    }
});