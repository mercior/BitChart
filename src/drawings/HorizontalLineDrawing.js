import { DrawingBase } from './DrawingBase.js';
import { SIZES } from '../constants.js';

export class HorizontalLineDrawing extends DrawingBase {
    constructor(price) {
        super('horizontalLine');
        this.anchors = [{ time: 0, price }];
        this._isPlacing = false;
    }

    clone() {
        const c = new HorizontalLineDrawing(this.anchors[0].price);
        this._copyBaseProps(c);
        return c;
    }

    hitTest(x, y, timeScale, priceScale) {
        const py = priceScale.priceToY(this.anchors[0].price);
        return Math.abs(y - py) <= SIZES.hitTestTolerance;
    }

    getAnchorHandles(timeScale, priceScale) {
        const y = priceScale.priceToY(this.anchors[0].price);
        return [
            { x: 40, y },
            { x: timeScale.chartWidth - 40, y },
        ];
    }

    moveAnchor(anchorIdx, newTime, newPrice) {
        if (this.isLocked) return;
        this.anchors[0].price = newPrice;
    }

    moveAll(deltaTime, deltaPrice) {
        if (this.isLocked) return;
        this.anchors[0].price += deltaPrice;
    }

    toJSON(dataStore) {
        return super.toJSON(dataStore);
    }

    draw(ctx, timeScale, priceScale) {
        const y = Math.round(priceScale.priceToY(this.anchors[0].price)) + 0.5;

        this._applyStyle(ctx);

        if (this.isHovered || this.isSelected) {
            ctx.lineWidth = this.style.lineWidth + 1;
        }

        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(timeScale.chartWidth, y);
        ctx.stroke();

        // Price label on right edge
        const priceText = this.anchors[0].price.toFixed(2);
        ctx.font = '11px sans-serif';
        const tw = ctx.measureText(priceText).width;
        ctx.fillStyle = this.style.color;
        ctx.globalAlpha = 0.8;
        ctx.fillRect(timeScale.chartWidth - tw - 12, y - 10, tw + 10, 20);
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = this.style.opacity;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(priceText, timeScale.chartWidth - 6, y);

        this._resetStyle(ctx);
    }
}
