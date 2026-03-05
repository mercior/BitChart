import { DrawingBase } from './DrawingBase.js';
import { SIZES } from '../constants.js';

export class TextDrawing extends DrawingBase {
    constructor(time, price, text) {
        super('text');
        this.anchors = [{ time, price }];
        this.text = text || 'Text';
        this.fontFamily = 'Trebuchet MS';
        this._isPlacing = false;
    }

    clone() {
        const c = new TextDrawing(this.anchors[0].time, this.anchors[0].price, this.text);
        this._copyBaseProps(c);
        c.fontFamily = this.fontFamily;
        return c;
    }

    hitTest(x, y, timeScale, priceScale) {
        const pts = this.getPixelCoords(timeScale, priceScale);
        if (pts.length === 0) return false;
        const px = pts[0].x;
        const py = pts[0].y;
        // Approximate bounding box
        const textW = this.text.length * this.style.fontSize * 0.6;
        const textH = this.style.fontSize * 1.4;
        return x >= px - 4 && x <= px + textW + 4 && y >= py - textH && y <= py + 4;
    }

    getAnchorHandles(timeScale, priceScale) {
        const pts = this.getPixelCoords(timeScale, priceScale);
        return pts;
    }

    draw(ctx, timeScale, priceScale) {
        const pts = this.getPixelCoords(timeScale, priceScale);
        if (pts.length === 0) return;

        ctx.globalAlpha = this.style.opacity;
        ctx.font = `${this.style.fontSize}px "${this.fontFamily}", Roboto, sans-serif`;

        if (this.style.fillColor) {
            const textW = ctx.measureText(this.text).width;
            ctx.fillStyle = this.style.fillColor;
            ctx.fillRect(pts[0].x - 2, pts[0].y - this.style.fontSize, textW + 4, this.style.fontSize * 1.4);
        }

        ctx.fillStyle = this.style.color;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        ctx.fillText(this.text, pts[0].x, pts[0].y);

        if (this.isSelected) {
            const textW = ctx.measureText(this.text).width;
            ctx.strokeStyle = '#2962ff';
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 3]);
            ctx.strokeRect(pts[0].x - 2, pts[0].y - this.style.fontSize, textW + 4, this.style.fontSize * 1.4);
            ctx.setLineDash([]);
        }

        ctx.globalAlpha = 1.0;
    }
}
