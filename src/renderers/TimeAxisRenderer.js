import { COLORS, SIZES, FONTS } from '../constants.js';
import { formatTime } from '../utils.js';

export class TimeAxisRenderer {
    constructor(chart) {
        this._chart = chart;
    }

    draw() {
        const ctx = this._chart.layout.timeAxisCtx;
        const w = this._chart.layout.chartWidth + SIZES.priceAxisWidth;
        const h = SIZES.timeAxisHeight;
        if (!ctx || w < 1) return;

        ctx.clearRect(0, 0, w, h);

        // Top border line
        ctx.strokeStyle = COLORS.axisLine;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, 0.5);
        ctx.lineTo(w, 0.5);
        ctx.stroke();

        const ts = this._chart.timeScale;
        const ds = this._chart.dataStore;
        const range = ts.visibleRangeExtended();
        if (!range) return;

        const targetSpacingPx = 120;
        const barsPerTick = Math.max(1, Math.round(targetSpacingPx / ts.barStep));

        ctx.font = FONTS.axis;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillStyle = COLORS.textSecondary;

        const startTick = Math.ceil(range.from / barsPerTick) * barsPerTick;
        for (let i = startTick; i <= range.to; i += barsPerTick) {
            const time = ds.getTimeForIndex(i);
            if (time === 0) continue;
            const x = Math.round(ts.indexToX(i));

            // Tick mark
            ctx.strokeStyle = COLORS.axisLine;
            ctx.beginPath();
            ctx.moveTo(x + 0.5, 0);
            ctx.lineTo(x + 0.5, SIZES.axisTickLength);
            ctx.stroke();

            // Time label
            ctx.fillStyle = COLORS.textSecondary;
            ctx.fillText(formatTime(time, ts.barWidth), x, SIZES.axisTickLength + 2);
        }

        this._drawCrosshairLabel(ctx, h);
    }

    _drawCrosshairLabel(ctx, h) {
        const ch = this._chart.crosshair;
        if (!ch.visible || !ch.time) return;

        const x = ch.x;
        const labelText = formatTime(ch.time, 100);
        ctx.font = FONTS.crosshair;
        const textWidth = ctx.measureText(labelText).width;
        const labelW = textWidth + SIZES.crosshairLabelPadding * 2;
        const labelH = SIZES.crosshairLabelHeight;

        ctx.fillStyle = COLORS.crosshairLabel;
        ctx.fillRect(x - labelW / 2, 0, labelW, labelH);

        ctx.fillStyle = COLORS.crosshairLabelText;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(labelText, x, labelH / 2);
    }
}
