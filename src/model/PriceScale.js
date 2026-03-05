import { EventEmitter } from '../core/EventEmitter.js';
import { SIZES } from '../constants.js';

export class PriceScale extends EventEmitter {
    constructor(layout) {
        super();
        this._layout = layout;
        this._minPrice = 0;
        this._maxPrice = 100;
        this._isAutoScale = true;
        this._isLogScale = false;
    }

    get minPrice() { return this._minPrice; }
    get maxPrice() { return this._maxPrice; }
    get isAutoScale() { return this._isAutoScale; }
    get isLogScale() { return this._isLogScale; }
    get priceRange() { return this._maxPrice - this._minPrice; }

    get chartHeight() {
        return this._layout.chartHeight;
    }

    setLogScale(enabled) {
        this._isLogScale = enabled;
        this.emit('scaleChanged');
    }

    priceToY(price) {
        if (this._isLogScale && this._minPrice > 0 && price > 0) {
            const logMin = Math.log(this._minPrice);
            const logMax = Math.log(this._maxPrice);
            const logRange = logMax - logMin;
            if (logRange === 0) return this.chartHeight / 2;
            return this.chartHeight - ((Math.log(price) - logMin) / logRange) * this.chartHeight;
        }
        const range = this._maxPrice - this._minPrice;
        if (range === 0) return this.chartHeight / 2;
        return this.chartHeight - ((price - this._minPrice) / range) * this.chartHeight;
    }

    yToPrice(y) {
        if (this._isLogScale && this._minPrice > 0) {
            const logMin = Math.log(this._minPrice);
            const logMax = Math.log(this._maxPrice);
            const logRange = logMax - logMin;
            const logPrice = logMin + ((this.chartHeight - y) / this.chartHeight) * logRange;
            return Math.exp(logPrice);
        }
        const range = this._maxPrice - this._minPrice;
        return this._minPrice + ((this.chartHeight - y) / this.chartHeight) * range;
    }

    autoFitToData(visibleCandles) {
        if (!visibleCandles || visibleCandles.length === 0) return;

        let min = Infinity;
        let max = -Infinity;
        for (const c of visibleCandles) {
            if (c.low < min) min = c.low;
            if (c.high > max) max = c.high;
        }

        const range = max - min;
        const padding = range * SIZES.priceScalePadding;
        this._minPrice = min - padding;
        this._maxPrice = max + padding;

        if (this._maxPrice === this._minPrice) {
            this._maxPrice += 1;
            this._minPrice -= 1;
        }
        if (this._isLogScale && this._minPrice <= 0) {
            this._minPrice = 0.01;
        }

        this.emit('scaleChanged');
    }

    setRange(min, max) {
        this._minPrice = min;
        this._maxPrice = max;
        this._isAutoScale = false;
        this.emit('scaleChanged');
    }

    scaleBy(factor, anchorY) {
        const anchorPrice = this.yToPrice(anchorY);
        const newMin = anchorPrice - (anchorPrice - this._minPrice) * factor;
        const newMax = anchorPrice + (this._maxPrice - anchorPrice) * factor;
        this._minPrice = newMin;
        this._maxPrice = newMax;
        this._isAutoScale = false;
        this.emit('scaleChanged');
    }

    panBy(deltaPixels) {
        if (this._isLogScale && this._minPrice > 0) {
            const logMin = Math.log(this._minPrice);
            const logMax = Math.log(this._maxPrice);
            const logRange = logMax - logMin;
            const logDelta = (deltaPixels / this.chartHeight) * logRange;
            this._minPrice = Math.exp(logMin + logDelta);
            this._maxPrice = Math.exp(logMax + logDelta);
        } else {
            const pricePerPixel = this.priceRange / this.chartHeight;
            const deltaPrices = deltaPixels * pricePerPixel;
            this._minPrice += deltaPrices;
            this._maxPrice += deltaPrices;
        }
        this._isAutoScale = false;
        this.emit('scaleChanged');
    }

    resetAutoScale() {
        this._isAutoScale = true;
        this.emit('scaleChanged');
    }
}
