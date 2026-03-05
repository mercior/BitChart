import { EventEmitter } from '../core/EventEmitter.js';
import { clamp } from '../utils.js';
import { SIZES } from '../constants.js';

export class TimeScale extends EventEmitter {
    constructor(layout, barWidth, barSpacing) {
        super();
        this._layout = layout;
        this._barWidth = barWidth;
        this._barSpacing = barSpacing;
        this._scrollOffset = 0;
        this._dataLength = 0;
        this._followMode = true;
    }

    get barWidth() { return this._barWidth; }
    get barSpacing() { return this._barSpacing; }
    get barStep() { return this._barWidth + this._barSpacing; }

    setDataLength(len) {
        this._dataLength = len;
    }

    setChartWidth(w) {
        // No-op, layout already tracks it
    }

    get chartWidth() {
        return this._layout.chartWidth;
    }

    indexToX(index) {
        const rightEdge = this.chartWidth;
        return rightEdge - (this._scrollOffset - index) * this.barStep;
    }

    xToIndex(x) {
        const rightEdge = this.chartWidth;
        return this._scrollOffset - (rightEdge - x) / this.barStep;
    }

    visibleRange() {
        if (this._dataLength === 0) return null;
        const firstIdx = this.xToIndex(0);
        const lastIdx = this.xToIndex(this.chartWidth);
        return {
            from: Math.max(0, Math.floor(firstIdx)),
            to: Math.min(this._dataLength - 1, Math.ceil(lastIdx)),
        };
    }

    get followMode() { return this._followMode; }

    scrollBy(deltaPixels) {
        this._scrollOffset -= deltaPixels / this.barStep;
        this._followMode = false;
        this._clampScroll();
        this.emit('scaleChanged');
    }

    scrollToEnd() {
        this._scrollOffset = this._dataLength - 1;
        this._followMode = true;
        this.emit('scaleChanged');
    }

    zoomAt(centerX, factor) {
        const centerIndex = this.xToIndex(centerX);
        const newBarWidth = clamp(this._barWidth * factor, SIZES.minBarWidth, SIZES.maxBarWidth);
        if (newBarWidth === this._barWidth) return;

        this._barWidth = newBarWidth;
        // Adjust barSpacing proportionally
        this._barSpacing = Math.max(1, Math.round(newBarWidth * 0.2));

        // Keep the center index at the same pixel position after zoom
        const newStep = this._barWidth + this._barSpacing;
        this._scrollOffset = centerIndex + (this.chartWidth - centerX) / newStep;
        this._clampScroll();
        this.emit('scaleChanged');
    }

    setBarWidth(newWidth) {
        this._barWidth = clamp(newWidth, SIZES.minBarWidth, SIZES.maxBarWidth);
        this._barSpacing = Math.max(1, Math.round(this._barWidth * 0.2));
        this._clampScroll();
        this.emit('scaleChanged');
    }

    fitContent() {
        if (this._dataLength === 0) return;
        const barsToFit = this._dataLength;
        const availableWidth = this.chartWidth;
        const step = availableWidth / barsToFit;
        this._barWidth = clamp(step * 0.8, SIZES.minBarWidth, SIZES.maxBarWidth);
        this._barSpacing = Math.max(1, step - this._barWidth);
        this._scrollOffset = this._dataLength - 1;
        this.emit('scaleChanged');
    }

    _clampScroll() {
        const minVisible = 5;
        const maxScrollRight = this._dataLength - 1 + this.chartWidth / this.barStep * 0.5;
        const minScrollLeft = -this.chartWidth / this.barStep * 0.5 + minVisible;
        this._scrollOffset = clamp(this._scrollOffset, minScrollLeft, maxScrollRight);
    }
}
