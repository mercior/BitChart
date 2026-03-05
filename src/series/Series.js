export class Series {
    constructor(dataStore, candleStyle) {
        this._dataStore = dataStore;
        this._candleStyle = candleStyle;
    }

    get candleStyle() {
        return this._candleStyle;
    }

    setCandleStyle(newStyle) {
        this._candleStyle = newStyle;
    }

    getVisibleBars(timeScale, priceScale) {
        const range = timeScale.visibleRange();
        if (!range) return [];
        const candles = this._dataStore.getRange(range.from, range.to);
        return this._candleStyle.prepareBars(candles, timeScale, priceScale, range.from);
    }
}
