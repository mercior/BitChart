export class CrosshairController {
    constructor(chart) {
        this._chart = chart;
    }

    onMouseMove(e) {
        const rect = this._chart.layout.uiCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const ts = this._chart.timeScale;
        const ps = this._chart.priceScale;
        const ds = this._chart.dataStore;

        const floatIndex = ts.xToIndex(x);
        const candleIndex = Math.round(floatIndex);
        const candle = ds.getCandle(candleIndex);

        const snappedX = ts.indexToX(candleIndex);
        const price = ps.yToPrice(y);
        const time = candle ? candle.time : null;

        this._chart.crosshair.update(snappedX, y, price, time, candleIndex);
    }

    onMouseLeave() {
        this._chart.crosshair.hide();
    }
}
