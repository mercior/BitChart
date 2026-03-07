import { DrawingBase } from './DrawingBase.js';
import { pointToSegmentDistance } from '../utils.js';
import { SIZES } from '../constants.js';

export class TriangleDrawing extends DrawingBase {
    constructor(time, price) {
        super('triangle');
        this.anchors = [
            { time, price },
            { time, price },
            { time, price },
        ];
        this._placementStep = 0;
        this.style.fillColor = 'rgba(41, 98, 255, 0.2)';
        this.style.fillOpacity = 0.2;
        this.style.borderOpacity = 1.0;
    }

    clone() {
        const c = new TriangleDrawing(this.anchors[0].time, this.anchors[0].price);
        c.anchors[1] = { ...this.anchors[1] };
        c.anchors[2] = { ...this.anchors[2] };
        c._placementStep = 2;
        this._copyBaseProps(c);
        return c;
    }

    updatePendingAnchor(time, price) {
        if (this._placementStep === 0) {
            this.anchors[1].time = time;
            this.anchors[1].price = price;
            this.anchors[2].time = time;
            this.anchors[2].price = price;
        } else if (this._placementStep === 1) {
            this.anchors[2].time = time;
            this.anchors[2].price = price;
        }
    }

    advancePlacement(time, price) {
        if (this._placementStep === 0) {
            this.anchors[1].time = time;
            this.anchors[1].price = price;
            this._placementStep = 1;
            return false;
        }
        if (this._placementStep === 1) {
            this.anchors[2].time = time;
            this.anchors[2].price = price;
            this._placementStep = 2;
            this._isPlacing = false;
            return true;
        }
        return true;
    }

    finalizePlacement(time, price) {
        this.anchors[2].time = time;
        this.anchors[2].price = price;
        this._placementStep = 2;
        this._isPlacing = false;
    }

    _pointInTriangle(px, py, pts) {
        const [a, b, c] = pts;
        const d1 = (px - b.x) * (a.y - b.y) - (a.x - b.x) * (py - b.y);
        const d2 = (px - c.x) * (b.y - c.y) - (b.x - c.x) * (py - c.y);
        const d3 = (px - a.x) * (c.y - a.y) - (c.x - a.x) * (py - a.y);
        const hasNeg = (d1 < 0) || (d2 < 0) || (d3 < 0);
        const hasPos = (d1 > 0) || (d2 > 0) || (d3 > 0);
        return !(hasNeg && hasPos);
    }

    hitTest(x, y, timeScale, priceScale) {
        const pts = this.getPixelCoords(timeScale, priceScale);
        if (pts.length < 3) return false;

        const tol = SIZES.hitTestTolerance;

        if (this.style.fillColor && this._pointInTriangle(x, y, pts)) {
            return true;
        }

        const edges = [
            [pts[0], pts[1]],
            [pts[1], pts[2]],
            [pts[2], pts[0]],
        ];
        for (const [a, b] of edges) {
            if (pointToSegmentDistance(x, y, a.x, a.y, b.x, b.y) <= tol) return true;
        }
        return false;
    }

    toJSON(dataStore) {
        return super.toJSON(dataStore);
    }

    draw(ctx, timeScale, priceScale) {
        const pts = this.getPixelCoords(timeScale, priceScale);
        if (pts.length < 3) return;

        ctx.save();

        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        ctx.lineTo(pts[1].x, pts[1].y);
        ctx.lineTo(pts[2].x, pts[2].y);
        ctx.closePath();

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
        ctx.moveTo(pts[0].x, pts[0].y);
        ctx.lineTo(pts[1].x, pts[1].y);
        ctx.lineTo(pts[2].x, pts[2].y);
        ctx.closePath();
        ctx.stroke();

        ctx.restore();
    }
}
