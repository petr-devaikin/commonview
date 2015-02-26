define([], function() {
    return function(size, x, y) {
        this.size = size;
        this.x = x;
        this.y = y;
        this.pixels = new Array(3 * this.size * this.size);
        this.image = undefined;
        this.diff = 255;

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

        this.addPixel = function(dX, dY, color) {
            this.pixels[3 * (dY * this.size + dX)] = color[0];
            this.pixels[3 * (dY * this.size + dX) + 1] = color[1];
            this.pixels[3 * (dY * this.size + dX) + 2] = color[2];
        }

        this.toHash = function() {
            if (this.image === undefined)
                return undefined;
            else
                return {
                    x: this.x,
                    y: this.y,
                    imageId: this.image.id,
                }
        }

        this.fromHash = function(data) {
            this.x = data.x;
            this.y = data.y;
            // Load image by id!
            return;
            this.image = data.imageId;
            this.diff = data.diff;
        }
    }
})