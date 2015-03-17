define(['settings', 'helpers'], function(settings, helpers) {
    return function(x, y) {
        this.x = x;
        this.y = y;
        this.pixels = new Array(3 * settings.groupSize * settings.groupSize);
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

        this.addPixel = function(dX, dY, color) {
            this.pixels[3 * (dY * settings.groupSize + dX)] = color[0];
            this.pixels[3 * (dY * settings.groupSize + dX) + 1] = color[1];
            this.pixels[3 * (dY * settings.groupSize + dX) + 2] = color[2];
        }

        this.toHash = function() {
            return null;
            if (!this.changed)
                return undefined;
            else {
                return {
                    x: this.x,
                    y: this.y,
                    image: this.image.toHash(),
                }
            }
        }

        this.fromHash = function(data) {
            this.image = data;
        }
    }
})