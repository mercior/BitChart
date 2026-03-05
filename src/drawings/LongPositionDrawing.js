import { DrawingBase } from './DrawingBase.js';
import { formatPrice } from '../utils.js';
import { SIZES } from '../constants.js';

export class LongPositionDrawing extends DrawingBase {
    constructor(time, price) {
        super('longPosition');
        this.anchors = [
            { time, price },
            { time, price },
            { time, price },
        ];
        this.width = 40;
        this.qty = 0.1;
        this.accountSize = 10000;
        this._isPlacing = true;
    }

    get entryPrice() { return this.anchors[0].price; }
    get targetPrice() { return this.anchors[1].price; }
    get stopPrice() { return this.anchors[2].price; }

    clone() {
        const c = new LongPositionDrawing(this.anchors[0].time, this.anchors[0].price);
        c.anchors = this.anchors.map(a => ({ ...a }));
        c.width = this.width;
        c.qty = this.qty;
        c.accountSize = this.accountSize;
        this._copyBaseProps(c);
        return c;
    }

    updatePendingAnchor(time, price) {
        this.anchors[1].price = price;
        const diff = price - this.anchors[0].price;
        this.anchors[2].price = this.anchors[0].price - diff;
        this.width = Math.max(20, Math.abs(time - this.anchors[0].time));
    }

    finalizePlacement(time, price) {
        this.anchors[1].price = price;
        const diff = price - this.anchors[0].price;
        this.anchors[2].price = this.anchors[0].price - diff;
        this.width = Math.max(20, Math.abs(time - this.anchors[0].time));
        this._isPlacing = false;
    }

    moveAnchor(anchorIdx, newTime, newPrice) {
        if (this.isLocked) return;
        if (anchorIdx === 0) {
            const targetDiff = this.anchors[1].price - this.anchors[0].price;
            const stopDiff = this.anchors[2].price - this.anchors[0].price;
            this.anchors[0].price = newPrice;
            this.anchors[0].time = newTime;
            this.anchors[1].price = newPrice + targetDiff;
            this.anchors[2].price = newPrice + stopDiff;
        } else if (anchorIdx === 1) {
            this.anchors[1].price = newPrice;
        } else if (anchorIdx === 2) {
            this.anchors[2].price = newPrice;
        }
    }

    moveAll(deltaTime, deltaPrice) {
        if (this.isLocked) return;
        for (const a of this.anchors) {
            a.time += deltaTime;
            a.price += deltaPrice;
        }
    }

    _getBox(timeScale, priceScale) {
        const entryX = timeScale.indexToX(this.anchors[0].time);
        const rightX = entryX + this.width * timeScale.barStep;
        const entryY = priceScale.priceToY(this.entryPrice);
        const targetY = priceScale.priceToY(this.targetPrice);
        const stopY = priceScale.priceToY(this.stopPrice);
        return { left: Math.min(entryX, rightX), right: Math.max(entryX, rightX), entryY, targetY, stopY };
    }

    getAnchorHandles(timeScale, priceScale) {
        const b = this._getBox(timeScale, priceScale);
        const midX = (b.left + b.right) / 2;
        return [
            { x: midX, y: b.entryY },
            { x: midX, y: b.targetY },
            { x: midX, y: b.stopY },
            { x: b.left, y: b.targetY },
            { x: b.right, y: b.targetY },
            { x: b.left, y: b.stopY },
            { x: b.right, y: b.stopY },
        ];
    }

    hitTest(x, y, timeScale, priceScale) {
        const b = this._getBox(timeScale, priceScale);
        const top = Math.min(b.targetY, b.stopY);
        const bottom = Math.max(b.targetY, b.stopY);
        const tol = SIZES.hitTestTolerance;
        return x >= b.left - tol && x <= b.right + tol && y >= top - tol && y <= bottom + tol;
    }

    draw(ctx, timeScale, priceScale) {
        const b = this._getBox(timeScale, priceScale);
        const boxW = b.right - b.left;
        if (boxW < 2) return;

        ctx.save();

        const profitTop = Math.min(b.entryY, b.targetY);
        const profitH = Math.abs(b.entryY - b.targetY);
        ctx.globalAlpha = 0.18;
        ctx.fillStyle = '#26a69a';
        ctx.fillRect(b.left, profitTop, boxW, profitH);

        const lossTop = Math.min(b.entryY, b.stopY);
        const lossH = Math.abs(b.entryY - b.stopY);
        ctx.globalAlpha = 0.18;
        ctx.fillStyle = '#ef5350';
        ctx.fillRect(b.left, lossTop, boxW, lossH);

        ctx.globalAlpha = 1;
        ctx.setLineDash([]);
        ctx.lineWidth = 1;

        ctx.strokeStyle = '#26a69a';
        ctx.beginPath();
        ctx.moveTo(b.left, b.targetY);
        ctx.lineTo(b.right, b.targetY);
        ctx.stroke();

        ctx.strokeStyle = '#ef5350';
        ctx.beginPath();
        ctx.moveTo(b.left, b.stopY);
        ctx.lineTo(b.right, b.stopY);
        ctx.stroke();

        ctx.strokeStyle = '#787b86';
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.moveTo(b.left, b.entryY);
        ctx.lineTo(b.right, b.entryY);
        ctx.stroke();
        ctx.setLineDash([]);

        const entry = this.entryPrice;
        const target = this.targetPrice;
        const stop = this.stopPrice;
        const targetPct = Math.abs((target - entry) / entry * 100).toFixed(3);
        const stopPct = Math.abs((entry - stop) / entry * 100).toFixed(3);
        const targetAmount = Math.round(Math.abs(target - entry) * this.qty);
        const stopAmount = Math.round(Math.abs(entry - stop) * this.qty);
        const riskReward = stopAmount > 0 ? (targetAmount / stopAmount).toFixed(1) : '---';
        const pnl = Math.round((target - entry) * this.qty);

        ctx.font = '11px sans-serif';
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';

        const targetLabel = `Target: ${formatPrice(target)} (${targetPct}%), Amount: ${targetAmount}`;
        this._drawTag(ctx, targetLabel, b.left, b.right, b.targetY, -1, '#26a69a');

        const stopLabel = `Stop: ${formatPrice(stop)} (${stopPct}%), Amount: ${stopAmount}`;
        this._drawTag(ctx, stopLabel, b.left, b.right, b.stopY, 1, '#ef5350');

        const infoText = `Open P&L: ${pnl}, Qty: ${this.qty}, Risk/Reward Ratio: ${riskReward}`;
        ctx.font = '10px sans-serif';
        const tw = ctx.measureText(infoText).width;
        const cx = b.left + boxW / 2;
        const infoW = tw + 16;
        const infoH = 22;
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = '#1e222d';
        ctx.fillRect(cx - infoW / 2, b.entryY - infoH / 2, infoW, infoH);
        ctx.strokeStyle = '#2a2e39';
        ctx.lineWidth = 1;
        ctx.strokeRect(cx - infoW / 2, b.entryY - infoH / 2, infoW, infoH);
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#d1d4dc';
        ctx.fillText(infoText, cx, b.entryY);

        if (this.isHovered || this.isSelected) {
            ctx.strokeStyle = '#2962ff';
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 3]);
            const top = Math.min(b.targetY, b.stopY);
            const bottom = Math.max(b.targetY, b.stopY);
            ctx.strokeRect(b.left, top, boxW, bottom - top);
            ctx.setLineDash([]);
        }

        ctx.restore();
    }

    _drawTag(ctx, text, left, right, y, direction, bgColor) {
        const boxW = right - left;
        const cx = left + boxW / 2;
        const tw = ctx.measureText(text).width;
        const tagW = tw + 16;
        const tagH = 18;
        const tagY = direction < 0 ? y - tagH - 2 : y + 2;
        ctx.globalAlpha = 0.92;
        ctx.fillStyle = bgColor;
        ctx.fillRect(cx - tagW / 2, tagY, tagW, tagH);
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText(text, cx, tagY + tagH / 2);
    }
}
