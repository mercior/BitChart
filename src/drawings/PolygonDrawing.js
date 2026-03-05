import { DrawingBase } from './DrawingBase.js';
import { pointToSegmentDistance } from '../utils.js';
import { SIZES } from '../constants.js';

export class PolygonDrawing extends DrawingBase {
    constructor(time, price) {
        super('polygon');
        this.anchors = [{ time, price }];
        this._pendingPoint = { time, price };
        this.style.fillColor = 'rgba(41, 98, 255, 0.2)';
        this.style.fillOpacity = 0.2;
        this.style.borderOpacity = 1.0;
    }

    clone() {
        const c = new PolygonDrawing(this.anchors[0].time, this.anchors[0].price);
        c.anchors = this.anchors.map(a => ({ ...a }));
        c._pendingPoint = null;
        this._copyBaseProps(c);
        return c;
    }

    updatePendingAnchor(time, price) {
        this._pendingPoint = { time, price };
    }

    addPoint(time, price) {
        this.anchors.push({ time, price });
        this._pendingPoint = { time, price };
    }

    finalizePlacement() {
        this._pendingPoint = null;
        this._isPlacing = false;
    }

    getPixelCoords(timeScale, priceScale) {
        const pts = this.anchors.map(a => ({
            x: timeScale.indexToX(a.time),
            y: priceScale.priceToY(a.price),
        }));
        if (this._isPlacing && this._pendingPoint) {
            pts.push({
                x: timeScale.indexToX(this._pendingPoint.time),
                y: priceScale.priceToY(this._pendingPoint.price),
            });
        }
        return pts;
    }

    getAnchorHandles(timeScale, priceScale) {
        return this.anchors.map(a => ({
            x: timeScale.indexToX(a.time),
            y: priceScale.priceToY(a.price),
        }));
    }

    _pointInPolygon(px, py, pts) {
        let inside = false;
        for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
            const xi = pts[i].x, yi = pts[i].y;
            const xj = pts[j].x, yj = pts[j].y;
            if (((yi > py) !== (yj > py)) &&
                (px < (xj - xi) * (py - yi) / (yj - yi) + xi)) {
                inside = !inside;
            }
        }
        return inside;
    }

    hitTest(x, y, timeScale, priceScale) {
        const pts = this.getAnchorHandles(timeScale, priceScale);
        if (pts.length < 2) return false;

        const tol = SIZES.hitTestTolerance;

        if (pts.length >= 3 && this.style.fillColor && this._pointInPolygon(x, y, pts)) {
            return true;
        }

        for (let i = 0; i < pts.length; i++) {
            const a = pts[i];
            const b = pts[(i + 1) % pts.length];
            if (pointToSegmentDistance(x, y, a.x, a.y, b.x, b.y) <= tol) return true;
        }
        return false;
    }

    draw(ctx, timeScale, priceScale) {
        const pts = this.getPixelCoords(timeScale, priceScale);
        if (pts.length < 2) return;

        ctx.save();

        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) {
            ctx.lineTo(pts[i].x, pts[i].y);
        }
        if (!this._isPlacing) {
            ctx.closePath();
        }

        if (this.style.fillColor && !this._isPlacing && pts.length >= 3) {
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
        for (let i = 1; i < pts.length; i++) {
            ctx.lineTo(pts[i].x, pts[i].y);
        }
        if (!this._isPlacing) {
            ctx.closePath();
        }
        ctx.stroke();

        if (this._isPlacing && pts.length >= 3) {
            ctx.globalAlpha = 0.3;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
            ctx.lineTo(pts[0].x, pts[0].y);
            ctx.stroke();
        }

        ctx.restore();
    }
}
