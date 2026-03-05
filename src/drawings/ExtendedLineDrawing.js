import { DrawingBase } from './DrawingBase.js';
import { pointToLineDistance } from '../utils.js';
import { SIZES } from '../constants.js';

export class ExtendedLineDrawing extends DrawingBase {
    constructor(time, price, time2, price2) {
        super('extendedLine');
        this.anchors = [
            { time, price },
            { time: time2 !== undefined ? time2 : time, price: price2 !== undefined ? price2 : price },
        ];
    }

    clone() {
        const c = new ExtendedLineDrawing(this.anchors[0].time, this.anchors[0].price, this.anchors[1].time, this.anchors[1].price);
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

    hitTest(x, y, timeScale, priceScale) {
        const pts = this.getPixelCoords(timeScale, priceScale);
        if (pts.length < 2) return false;
        const dist = pointToLineDistance(x, y, pts[0].x, pts[0].y, pts[1].x, pts[1].y);
        return dist <= SIZES.hitTestTolerance;
    }

    draw(ctx, timeScale, priceScale) {
        const pts = this.getPixelCoords(timeScale, priceScale);
        if (pts.length < 2) return;

        this._applyStyle(ctx);

        if (this.isHovered || this.isSelected) {
            ctx.lineWidth = this.style.lineWidth + 1;
        }

        const chartW = timeScale.chartWidth;
        const chartH = priceScale.chartHeight;

        // Extend the line to canvas boundaries
        const dx = pts[1].x - pts[0].x;
        const dy = pts[1].y - pts[0].y;

        if (Math.abs(dx) < 0.001 && Math.abs(dy) < 0.001) {
            this._resetStyle(ctx);
            return;
        }

        let t0 = -1e6;
        let t1 = 1e6;

        // Clip to canvas bounds
        if (Math.abs(dx) > 0.001) {
            const tLeft = (0 - pts[0].x) / dx;
            const tRight = (chartW - pts[0].x) / dx;
            t0 = Math.max(t0, Math.min(tLeft, tRight));
            t1 = Math.min(t1, Math.max(tLeft, tRight));
        }
        if (Math.abs(dy) > 0.001) {
            const tTop = (0 - pts[0].y) / dy;
            const tBottom = (chartH - pts[0].y) / dy;
            t0 = Math.max(t0, Math.min(tTop, tBottom));
            t1 = Math.min(t1, Math.max(tTop, tBottom));
        }

        const x0 = pts[0].x + dx * t0;
        const y0 = pts[0].y + dy * t0;
        const x1 = pts[0].x + dx * t1;
        const y1 = pts[0].y + dy * t1;

        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();

        this._resetStyle(ctx);
    }
}
