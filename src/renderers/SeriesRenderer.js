import { COLORS } from '../constants.js';

export class SeriesRenderer {
    constructor(chart) {
        this._chart = chart;
    }

    draw() {
        const ctx = this._chart.layout.mainCtx;
        const w = this._chart.layout.chartWidth;
        const h = this._chart.layout.chartHeight;
        if (!ctx || w < 1 || h < 1) return;

        ctx.clearRect(0, 0, w, h);

        const bars = this._chart.series.getVisibleBars(
            this._chart.timeScale,
            this._chart.priceScale
        );

        if (bars.length === 0) return;

        this._chart.series.candleStyle.drawBars(ctx, bars, {
            barWidth: this._chart.timeScale.barWidth,
        });

        this._drawCurrentPriceLine(ctx, w);
    }

    _drawCurrentPriceLine(ctx, w) {
        const last = this._chart.dataStore.last;
        if (!last) return;

        const y = Math.round(this._chart.priceScale.priceToY(last.close)) + 0.5;
        const isUp = last.close >= last.open;
        ctx.strokeStyle = isUp ? COLORS.candleUp : COLORS.candleDown;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.globalAlpha = 0.6;

        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();

        ctx.setLineDash([]);
        ctx.globalAlpha = 1.0;
    }
}
