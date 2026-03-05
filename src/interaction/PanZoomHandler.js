export class PanZoomHandler {
    constructor(chart) {
        this._chart = chart;
        this._isPanning = false;
        this._lastX = 0;
        this._lastY = 0;
        this._velocityX = 0;
        this._velocityY = 0;
        this._kineticRafId = null;
    }

    onMouseDown(e) {
        this._isPanning = true;
        this._lastX = e.clientX;
        this._lastY = e.clientY;
        this._velocityX = 0;
        this._velocityY = 0;
        this._stopKinetic();
    }

    onMouseMove(e) {
        if (!this._isPanning) return false;
        const dx = e.clientX - this._lastX;
        const dy = e.clientY - this._lastY;
        this._velocityX = dx;
        this._velocityY = dy;
        this._chart.timeScale.scrollBy(dx);
        this._chart.priceScale.panBy(dy);
        this._lastX = e.clientX;
        this._lastY = e.clientY;
        return true;
    }

    onMouseUp(e) {
        if (!this._isPanning) return;
        this._isPanning = false;
        if (Math.abs(this._velocityX) > 2 || Math.abs(this._velocityY) > 2) {
            this._startKinetic();
        }
    }

    onWheel(e) {
        e.preventDefault();
        const rect = this._chart.layout.uiCanvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const factor = e.deltaY < 0 ? 1.1 : 0.9;
        this._chart.timeScale.zoomAt(mouseX, factor);
    }

    get isPanning() {
        return this._isPanning;
    }

    _startKinetic() {
        let vx = this._velocityX;
        let vy = this._velocityY;
        const deceleration = 0.95;
        const tick = () => {
            vx *= deceleration;
            vy *= deceleration;
            if (Math.abs(vx) < 0.5 && Math.abs(vy) < 0.5) return;
            this._chart.timeScale.scrollBy(vx);
            if (Math.abs(vy) > 0.5) this._chart.priceScale.panBy(vy);
            this._kineticRafId = requestAnimationFrame(tick);
        };
        this._kineticRafId = requestAnimationFrame(tick);
    }

    _stopKinetic() {
        if (this._kineticRafId !== null) {
            cancelAnimationFrame(this._kineticRafId);
            this._kineticRafId = null;
        }
    }

    destroy() {
        this._stopKinetic();
    }
}
