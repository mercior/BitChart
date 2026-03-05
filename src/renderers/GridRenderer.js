import { COLORS, SIZES, FONTS } from '../constants.js';
import { niceTicksForRange } from '../utils.js';

export class GridRenderer {
    constructor(chart) {
        this._chart = chart;
    }

    draw() {
        const ctx = this._chart.layout.bgCtx;
        const w = this._chart.layout.chartWidth;
        const h = this._chart.layout.chartHeight;
        if (!ctx || w < 1 || h < 1) return;

        ctx.clearRect(0, 0, w, h);

        this._drawHorizontalLines(ctx, w, h);
        this._drawVerticalLines(ctx, w, h);
    }

    _drawHorizontalLines(ctx, w, h) {
        const ps = this._chart.priceScale;
        const ticks = niceTicksForRange(ps.minPrice, ps.maxPrice, Math.floor(h / 60));

        ctx.strokeStyle = COLORS.gridLine;
        ctx.lineWidth = 1;
        ctx.setLineDash(SIZES.gridDashPattern);

        for (const price of ticks) {
            const y = Math.round(ps.priceToY(price)) + 0.5;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
        }
        ctx.setLineDash([]);
    }

    _drawVerticalLines(ctx, w, h) {
        const ts = this._chart.timeScale;
        const ds = this._chart.dataStore;
        const range = ts.visibleRange();
        if (!range) return;

        const targetSpacingPx = 120;
        const barsPerTick = Math.max(1, Math.round(targetSpacingPx / ts.barStep));

        ctx.strokeStyle = COLORS.gridLine;
        ctx.lineWidth = 1;
        ctx.setLineDash(SIZES.gridDashPattern);

        const startTick = Math.ceil(range.from / barsPerTick) * barsPerTick;
        for (let i = startTick; i <= range.to; i += barsPerTick) {
            const x = Math.round(ts.indexToX(i)) + 0.5;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
            ctx.stroke();
        }
        ctx.setLineDash([]);
    }
}
