import { uid } from '../utils.js';
import { DrawingStyle } from './DrawingStyle.js';
import { SIZES } from '../constants.js';

export class DrawingBase {
    constructor(type) {
        this.id = uid();
        this.type = type;
        this.style = new DrawingStyle();
        this.anchors = [];
        this.isSelected = false;
        this.isHovered = false;
        this.isLocked = false;
        this._isPlacing = true;
    }

    get isPlacing() {
        return this._isPlacing;
    }

    clone() {
        throw new Error('clone() must be implemented by subclass');
    }

    _copyBaseProps(target) {
        target.style = this.style.clone();
        target.isLocked = this.isLocked;
        target._isPlacing = false;
    }

    hitTest(x, y, timeScale, priceScale) {
        return false;
    }

    getPixelCoords(timeScale, priceScale) {
        return this.anchors.map(a => ({
            x: timeScale.indexToX(a.time),
            y: priceScale.priceToY(a.price),
        }));
    }

    getAnchorHandles(timeScale, priceScale) {
        return this.getPixelCoords(timeScale, priceScale);
    }

    moveAnchor(anchorIdx, newTime, newPrice) {
        if (this.isLocked) return;
        if (anchorIdx >= 0 && anchorIdx < this.anchors.length) {
            this.anchors[anchorIdx].time = newTime;
            this.anchors[anchorIdx].price = newPrice;
        }
    }

    moveAll(deltaTime, deltaPrice) {
        if (this.isLocked) return;
        for (const a of this.anchors) {
            a.time += deltaTime;
            a.price += deltaPrice;
        }
    }

    updatePendingAnchor(time, price) {}

    finalizePlacement(time, price) {
        this._isPlacing = false;
    }

    draw(ctx, timeScale, priceScale) {}

    toJSON(dataStore) {
        return {
            id: this.id,
            type: this.type,
            isLocked: this.isLocked,
            style: this.style.toJSON(),
            anchors: this.anchors.map(a => ({
                time: dataStore.indexToTime(a.time),
                price: a.price,
            })),
        };
    }

    _applyBaseJSON(data, dataStore) {
        this.id = data.id;
        this.isLocked = data.isLocked || false;
        this.style = DrawingStyle.fromJSON(data.style);
        this.anchors = data.anchors.map(a => ({
            time: dataStore.timeToIndex(a.time),
            price: a.price,
        }));
        this._isPlacing = false;
    }

    _applyStyle(ctx) {
        ctx.globalAlpha = this.style.opacity;
        ctx.strokeStyle = this.style.color;
        ctx.lineWidth = this.style.lineWidth;

        switch (this.style.lineStyle) {
            case 'dashed':
                ctx.setLineDash([6, 4]);
                break;
            case 'dotted':
                ctx.setLineDash([2, 2]);
                break;
            default:
                ctx.setLineDash([]);
                break;
        }
    }

    _resetStyle(ctx) {
        ctx.globalAlpha = 1.0;
        ctx.setLineDash([]);
    }
}
