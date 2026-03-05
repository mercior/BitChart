import { DrawingBase } from './DrawingBase.js';
import { pointToSegmentDistance } from '../utils.js';
import { SIZES } from '../constants.js';

export class RectangleDrawing extends DrawingBase {
    constructor(time, price, time2, price2) {
        super('rectangle');
        this.anchors = [
            { time, price },
            { time: time2 !== undefined ? time2 : time, price: price2 !== undefined ? price2 : price },
        ];
        this.style.fillColor = 'rgba(41, 98, 255, 0.2)';
        this.style.fillOpacity = 0.2;
        this.style.borderOpacity = 1.0;
    }

    clone() {
        const c = new RectangleDrawing(
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

    _getRect(timeScale, priceScale) {
        const pts = this.getPixelCoords(timeScale, priceScale);
        if (pts.length < 2) return null;
        const x = Math.min(pts[0].x, pts[1].x);
        const y = Math.min(pts[0].y, pts[1].y);
        const w = Math.abs(pts[1].x - pts[0].x);
        const h = Math.abs(pts[1].y - pts[0].y);
        return { x, y, w, h };
    }

    hitTest(x, y, timeScale, priceScale) {
        const r = this._getRect(timeScale, priceScale);
        if (!r) return false;

        const tol = SIZES.hitTestTolerance;

        if (this.style.fillColor) {
            if (x >= r.x - tol && x <= r.x + r.w + tol &&
                y >= r.y - tol && y <= r.y + r.h + tol) {
                return true;
            }
        }

        const edges = [
            [r.x, r.y, r.x + r.w, r.y],
            [r.x + r.w, r.y, r.x + r.w, r.y + r.h],
            [r.x + r.w, r.y + r.h, r.x, r.y + r.h],
            [r.x, r.y + r.h, r.x, r.y],
        ];
        for (const [x1, y1, x2, y2] of edges) {
            if (pointToSegmentDistance(x, y, x1, y1, x2, y2) <= tol) return true;
        }
        return false;
    }

    draw(ctx, timeScale, priceScale) {
        const r = this._getRect(timeScale, priceScale);
        if (!r) return;

        ctx.save();

        if (this.style.fillColor) {
            ctx.globalAlpha = this.style.fillOpacity;
            ctx.fillStyle = this.style.fillColor;
            ctx.fillRect(r.x, r.y, r.w, r.h);
        }

        this._applyStyle(ctx);
        ctx.globalAlpha = this.style.borderOpacity;
        if (this.isHovered || this.isSelected) {
            ctx.lineWidth = this.style.lineWidth + 1;
        }
        ctx.strokeRect(r.x, r.y, r.w, r.h);

        ctx.restore();
    }
}
