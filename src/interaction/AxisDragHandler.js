import { SIZES } from '../constants.js';

export class AxisDragHandler {
    constructor(chart) {
        this._chart = chart;
        this._dragging = null; // 'priceAxis' or 'timeAxis'
        this._startY = 0;
        this._startX = 0;
    }

    tryStartDrag(e, zone) {
        if (zone === 'priceAxis') {
            this._dragging = 'priceAxis';
            this._startY = e.clientY;
            return true;
        }
        if (zone === 'timeAxis') {
            this._dragging = 'timeAxis';
            this._startX = e.clientX;
            this._startBarWidth = this._chart.timeScale.barWidth;
            return true;
        }
        return false;
    }

    onMouseMove(e) {
        if (!this._dragging) return false;

        if (this._dragging === 'priceAxis') {
            const dy = e.clientY - this._startY;
            const factor = 1 + dy * 0.005;
            const rect = this._chart.layout.priceAxisCanvas.getBoundingClientRect();
            const anchorY = this._startY - rect.top;
            this._chart.priceScale.scaleBy(factor, anchorY);
            this._startY = e.clientY;
            return true;
        }

        if (this._dragging === 'timeAxis') {
            const dx = e.clientX - this._startX;
            const newWidth = this._startBarWidth + dx * 0.1;
            this._chart.timeScale.setBarWidth(newWidth);
            return true;
        }

        return false;
    }

    onMouseUp() {
        this._dragging = null;
    }

    get isDragging() {
        return this._dragging !== null;
    }

    destroy() {
        this._dragging = null;
    }
}
