import { DrawingBase } from './DrawingBase.js';
import { pointToSegmentDistance } from '../utils.js';
import { SIZES } from '../constants.js';

export class LineDrawing extends DrawingBase {
    constructor(time, price, time2, price2) {
        super('line');
        this.anchors = [
            { time, price },
            { time: time2 !== undefined ? time2 : time, price: price2 !== undefined ? price2 : price },
        ];
    }

    clone() {
        const c = new LineDrawing(this.anchors[0].time, this.anchors[0].price, this.anchors[1].time, this.anchors[1].price);
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
        const dist = pointToSegmentDistance(x, y, pts[0].x, pts[0].y, pts[1].x, pts[1].y);
        return dist <= SIZES.hitTestTolerance;
    }

    draw(ctx, timeScale, priceScale) {
        const pts = this.getPixelCoords(timeScale, priceScale);
        if (pts.length < 2) return;

        this._applyStyle(ctx);

        if (this.isHovered || this.isSelected) {
            ctx.lineWidth = this.style.lineWidth + 1;
        }

        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        ctx.lineTo(pts[1].x, pts[1].y);
        ctx.stroke();

        this._resetStyle(ctx);
    }
}
