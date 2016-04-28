define(['settings', 'helpers', 'libs/d3'], function(settings, helpers, d3) {
    return function(x, y) {
        this.x = x;
        this.y = y;
        this.pixels = new Array(3 * settings.groupSize * settings.groupSize);
        this.image = undefined;
        this.loading = false;

        this.lab = d3.lab('rgb('+this.pixels[0]+','+this.pixels[1]+','+this.pixels[2]+')');

        console.log("====");
        console.log(this.pixels);
        console.log(this.lab);

        this.calcDiff = function(colors) {
            var summa = 0;
            var count = 0;

            var c2 = d3.lab('rgb('+colors[0]+','+colors[1]+','+colors[2]+')');

            summa += (this.lab.l - c2.l) * (this.lab.l - c2.l);
            summa += (this.lab.a - c2.a) * (this.lab.a - c2.a);
            summa += (this.lab.b - c2.b) * (this.lab.b - c2.b);

            return Math.sqrt(summa);
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
