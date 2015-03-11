define(['libs/d3', 'libs/qwest'], function(d3, qwest) {
    var uploader = d3.select('#uploader'),
        allowedFileTypes = ['image/png', 'image/jpeg'],
        UPLOAD_URL = '/upload';

    function setError(text) {
        console.log(text);
    }

    return function(maxFileSize) {
        if (window.FileReader === undefined) {
            setText('Not supported!'); // !!!
            return;
        }

        document.ondragover = function() {
            uploader.classed('hover', true);
            return false;
        }


        uploader.node().ondragleave = function() {
            uploader.classed('hover', false);
            return false;
        }

        function uploadFile(file) {
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

        document.ondrop = function(event) {
            event.preventDefault();
            uploader.classed('hover', false);

            uploadFile(event.dataTransfer.files[0]);
        }

        document.getElementById('inputfile').addEventListener('change', function(e) {
            uploadFile(e.target.files[0]);
        }, false);

        d3.select('#new .original').on('click', function() {
            document.getElementById('inputfile').click();
        });
    }
});