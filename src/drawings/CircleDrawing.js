import { DrawingBase } from './DrawingBase.js';
import { SIZES } from '../constants.js';

export class CircleDrawing extends DrawingBase {
    constructor(time, price, time2, price2) {
        super('circle');
        this.anchors = [
            { time, price },
            { time: time2 !== undefined ? time2 : time, price: price2 !== undefined ? price2 : price },
        ];
        this.style.fillColor = 'rgba(41, 98, 255, 0.2)';
        this.style.fillOpacity = 0.2;
        this.style.borderOpacity = 1.0;
    }

    clone() {
        const c = new CircleDrawing(
            this.anchors[0].time, this.anchors[0].price,
            this.anchors[1].time, this.anchors[1].price
        );
        this._copyBaseProps(c);
        return c;
    }

    updatePendingAnchor(time, price) {
        this.anchors[1].time = time;
        this.anchors[1].price = price;
    }

    finalizePlacement(time, price) {
        this.anchors[1].time = time;
        this.anchors[1].price = price;
        this._isPlacing = false;
    }

    _getCircleParams(timeScale, priceScale) {
        const pts = this.getPixelCoords(timeScale, priceScale);
        if (pts.length < 2) return null;
        const cx = pts[0].x;
        const cy = pts[0].y;
        const radius = Math.hypot(pts[1].x - cx, pts[1].y - cy);
        return { cx, cy, radius };
    }

    hitTest(x, y, timeScale, priceScale) {
        const c = this._getCircleParams(timeScale, priceScale);
        if (!c) return false;

        const dist = Math.hypot(x - c.cx, y - c.cy);
        const tol = SIZES.hitTestTolerance;

        if (this.style.fillColor && dist <= c.radius + tol) {
            return true;
        }

        return Math.abs(dist - c.radius) <= tol;
    }

    toJSON(dataStore) {
        return super.toJSON(dataStore);
    }

    draw(ctx, timeScale, priceScale) {
        const c = this._getCircleParams(timeScale, priceScale);
        if (!c || c.radius < 1) return;

        ctx.save();

        ctx.beginPath();
        ctx.arc(c.cx, c.cy, c.radius, 0, Math.PI * 2);

        if (this.style.fillColor) {
            ctx.globalAlpha = this.style.fillOpacity;
            ctx.fillStyle = this.style.fillColor;
            ctx.fill();
        }

        this._applyStyle(ctx);
        ctx.globalAlpha = this.style.borderOpacity;
        if (this.isHovered || this.isSelected) {
            ctx.lineWidth = this.style.lineWidth + 1;
        }
        ctx.beginPath();
        ctx.arc(c.cx, c.cy, c.radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
    }
}
