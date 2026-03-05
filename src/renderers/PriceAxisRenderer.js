import { COLORS, SIZES, FONTS } from '../constants.js';
import { niceTicksForRange, formatPrice } from '../utils.js';

export class PriceAxisRenderer {
    constructor(chart) {
        this._chart = chart;
    }

    draw() {
        const ctx = this._chart.layout.priceAxisCtx;
        const w = SIZES.priceAxisWidth;
        const h = this._chart.layout.chartHeight;
        if (!ctx || h < 1) return;

        ctx.clearRect(0, 0, w, h);

        // Left border line
        ctx.strokeStyle = COLORS.axisLine;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0.5, 0);
        ctx.lineTo(0.5, h);
        ctx.stroke();

        const ps = this._chart.priceScale;
        const ticks = niceTicksForRange(ps.minPrice, ps.maxPrice, Math.floor(h / 60));

        ctx.font = FONTS.axis;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';

        for (const price of ticks) {
            const y = Math.round(ps.priceToY(price));

            // Tick mark
            ctx.strokeStyle = COLORS.axisLine;
            ctx.beginPath();
            ctx.moveTo(0, y + 0.5);
            ctx.lineTo(SIZES.axisTickLength, y + 0.5);
            ctx.stroke();

            // Price label
            ctx.fillStyle = COLORS.textSecondary;
            ctx.fillText(formatPrice(price), SIZES.axisTickLength + 4, y);
        }

        this._drawCurrentPriceLabel(ctx, w, h);
        this._drawCrosshairLabel(ctx, w, h);
    }

    _drawCurrentPriceLabel(ctx, w, h) {
        const last = this._chart.dataStore.last;
        if (!last) return;

        const ps = this._chart.priceScale;
        const y = Math.round(ps.priceToY(last.close));
        const isUp = last.close >= last.open;
        const bgColor = isUp ? COLORS.candleUp : COLORS.candleDown;
        const labelH = SIZES.crosshairLabelHeight;

        // Background
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, y - labelH / 2, w, labelH);

        // Text
        ctx.fillStyle = '#ffffff';
        ctx.font = FONTS.axis;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(formatPrice(last.close), SIZES.axisTickLength + 4, y);
    }

    _drawCrosshairLabel(ctx, w, h) {
        const ch = this._chart.crosshair;
        if (!ch.visible) return;

        const ps = this._chart.priceScale;
        const price = ps.yToPrice(ch.y);
        const y = ch.y;
        const labelH = SIZES.crosshairLabelHeight;

        ctx.fillStyle = COLORS.crosshairLabel;
        ctx.fillRect(0, y - labelH / 2, w, labelH);

        ctx.fillStyle = COLORS.crosshairLabelText;
        ctx.font = FONTS.axis;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(formatPrice(price), SIZES.axisTickLength + 4, y);
    }
}
