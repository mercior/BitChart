/**
 * Renders all active indicators on the main canvas layer.
 * Registered after SeriesRenderer so indicators draw on top of candles.
 */
export class IndicatorRenderer {
    constructor(chart) {
        this._chart = chart;
    }

    draw() {
        const chart = this._chart;
        const ctx = chart.layout.mainCtx;
        const w = chart.layout.chartWidth;
        const h = chart.layout.chartHeight;
        if (!ctx || w < 1 || h < 1) return;

        const indicators = chart.indicatorManager.indicators;
        for (const ind of indicators) {
            if (!ind.visible) continue;
            const data = chart.indicatorManager.getComputedData(ind.id);
            if (!data) continue;
            ind.draw(ctx, data, chart.timeScale, chart.priceScale, w, h);
        }
    }
}
