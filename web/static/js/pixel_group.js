define(['settings', 'libs/deltae', 'libs/d3'], function(settings, deltae, d3) {
    return function(x, y) {
        this.x = x;
        this.y = y;
        this.pixels = new Array(3 * settings.groupSize * settings.groupSize);
        this.image = undefined;
        this.loading = false;
        this.lab = [];

        this.calcDiff = function(colors) {
            var summa = 0;
            var count = 0;
            for (var i = 0; i < colors.length / 3; i++)
                if (this.pixels[i] !== undefined) {
                    var color1 = d3.lab('rgb('+colors[3 * i]+','+colors[3 * i + 1]+','+colors[3 * i + 2]+')');
                    var color2 = this.lab[i];
                    color1 = {
                        L: color1.l,
                        A: color1.a,
                        B: color1.b,
                    }
                    count++;
                    summa += deltae.getDeltaE00(color1, color2);
                }
            return summa / count;
        }

        this.addPixel = function(dX, dY, color) {
            this.pixels[3 * (dY * settings.groupSize + dX)] = color[0];
            this.pixels[3 * (dY * settings.groupSize + dX) + 1] = color[1];
            this.pixels[3 * (dY * settings.groupSize + dX) + 2] = color[2];
            var c = d3.lab('rgb('+color[0]+','+color[1]+','+color[2]+')');
            this.lab[dY * settings.groupSize + dX] = { L: c.l, A: c.a, B: c.b };
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
