// ref: https://github.com/d3/d3-shape/issues/74

class Step {
    constructor(context, t, radius) {
        this._context = context;
        this._t = t;
        this._radius = radius;
    }

    areaStart() {
        this._line = 0;
    }

    areaEnd() {
        this._line = NaN;
    }

    lineStart() {
        this._x = this._y = NaN;
        this._point = 0;
    }

    lineEnd() {
        if (0 < this._t && this._t < 1 && this._point === 2) this._context.lineTo(this._x, this._y);
        if (this._line || (this._line !== 0 && this._point === 1)) this._context.closePath();
        if (this._line >= 0) this._t = 1 - this._t, this._line = 1 - this._line;
    }

    point(x, y) {
        x = +x;
        y = +y;
        switch (this._point) {
            case 0:
                this._point = 1;
                this._line ? this._context.lineTo(x, y) : this._context.moveTo(x, y);
                break;
            case 1:
                this._point = 2; // proceed
            default:
                if (this._t <= 0) {
                    this._context.arcTo(this._x, y, this._x + this._radius, y, this._radius);
                    this._context.lineTo(x, y);
                } else {
                    const x1 = this._x * (1 - this._t) + x * this._t;
                    if (this._y < y - this._radius) {
                        this._context.arcTo(x1, this._y, x1, this._y + this._radius, this._radius);
                        if (0 < this._t && this._t < 1) {
                            this._context.arcTo(x1, y, x1 + this._radius, y, this._radius);
                        } else {
                            this._context.lineTo(x, y);
                        }
                    } else if (this._y > y + this._radius) {
                        this._context.arcTo(x1, this._y, x1, this._y - this._radius, this._radius);
                        if (0 < this._t && this._t < 1) {
                            this._context.arcTo(x1, y, x1 + this._radius, y, this._radius);
                        } else {
                            this._context.lineTo(x, y);
                        }
                    } else { // ∆y < radius
                        this._context.lineTo(x, y);
                    }
                }
                break;
        }
        this._x = x;
        this._y = y;
    }
}

export const customStep = (radius = 0) => {
    const step = (context) => new Step(context, 0.5, radius);

    step.radius = function (radius) {
        return customStep(+radius);
    };

    return step;
};
