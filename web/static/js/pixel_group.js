define(['settings', 'helpers'], function(settings, helpers) {
    return function(data) {
        this.x = data.x;
        this.y = data.y;
        this.pixels = data.colors;

        this.image = undefined;
        this.loading = false;

        this.calcDiff = function(colors) {
            var summa = 0;
            var count = 0;
            for (var i = 0; i < colors.length; i++)
                if (this.pixels[i] !== undefined) {
                    count++;
                    summa += Math.abs(this.pixels[i] - colors[i]);
                }
            return summa / count;
        }

        this.setImage = function(data) {
            this.image = data;
        }
    }
})