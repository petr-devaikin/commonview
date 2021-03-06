define(['libs/d3', 'libs/qwest', 'proxy'], function(d3, qwest, proxy) {
    return function() {
        d3.selectAll('.delete').on('click', function() {
            d3.event.preventDefault();
            var url = d3.select(this).attr('href');
            //var parent = d3.select(this.parentNode);
            qwest.delete(url)
                .then(function() {
                    window.location.reload();
                    //parent.remove();                 
                })
                .catch(function(e) {
                    console.log('Error while deleting: ' + e);
                });
        });
    }
});