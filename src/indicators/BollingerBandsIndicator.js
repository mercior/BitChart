import { IndicatorBase, nextDefaultColor } from './IndicatorBase.js';

export class BollingerBandsIndicator extends IndicatorBase {
    static get indicatorName() { return 'Bollinger Bands'; }
    static get shortName() { return 'BB'; }

    static get settingsConfig() {
        return [
            { key: 'period', label: 'Period', type: 'number', default: 20, min: 2, max: 500, step: 1, tab: 'inputs' },
            { key: 'stdDev', label: 'Std Deviation', type: 'number', default: 2, min: 0.1, max: 10, step: 0.1, tab: 'inputs' },
            { key: 'source', label: 'Source', type: 'select', default: 'close', options: ['open', 'high', 'low', 'close'], tab: 'inputs' },
            { key: 'timeframe', label: 'Timeframe', type: 'timeframe', default: 'chart', tab: 'inputs', group: 'Calculation' },
            { key: 'color', label: 'Color', type: 'color', default: null, tab: 'style', group: 'Lines' },
            { key: 'lineWidth', label: 'Line Width', type: 'number', default: 1, min: 0.5, max: 5, step: 0.5, tab: 'style', group: 'Lines' },
            { key: 'lineStyle', label: 'Line Style', type: 'lineStyle', default: 'solid', tab: 'style', group: 'Lines' },
            { key: 'fillOpacity', label: 'Fill Opacity', type: 'slider', default: 0.06, min: 0, max: 0.5, step: 0.01, tab: 'style', group: 'Fill' },
        ];
    }

    constructor(settings = {}) {
        super(settings);
        if (this.settings.color === null) {
            this.settings.color = nextDefaultColor();
        }
    }

    getLegendText() {
        return `BB (${this.settings.period}, ${this.settings.stdDev})`;
    }

    compute(candles) {
        const { period, stdDev, source } = this.settings;
        const len = candles.length;
        const result = new Array(len).fill(null);
        if (len < period) return result;

        for (let i = period - 1; i < len; i++) {
            let sum = 0;
            for (let j = i - period + 1; j <= i; j++) {
                sum += candles[j][source];
            }
            const mean = sum / period;

            let variance = 0;
            for (let j = i - period + 1; j <= i; j++) {
                const diff = candles[j][source] - mean;
                variance += diff * diff;
            }
            const sd = Math.sqrt(variance / period);

            result[i] = {
                middle: mean,
                upper: mean + stdDev * sd,
                lower: mean - stdDev * sd,
            };
        }
        return result;
    }

    draw(ctx, computedData, timeScale, priceScale, chartWidth, chartHeight) {
        if (!this.visible || !computedData) return;

        const range = timeScale.visibleRange();
        if (!range) return;

        const { color, lineWidth, lineStyle, fillOpacity } = this.settings;

        const upperPoints = [];
        const lowerPoints = [];

        for (let i = range.from; i <= range.to; i++) {
            const d = computedData[i];
            if (!d) continue;
            const x = timeScale.indexToX(i);
            upperPoints.push({ x, y: priceScale.priceToY(d.upper) });
            lowerPoints.push({ x, y: priceScale.priceToY(d.lower) });
        }

        if (upperPoints.length > 1 && fillOpacity > 0) {
            ctx.save();
            ctx.globalAlpha = fillOpacity;
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.moveTo(upperPoints[0].x, upperPoints[0].y);
            for (let i = 1; i < upperPoints.length; i++) {
                ctx.lineTo(upperPoints[i].x, upperPoints[i].y);
            }
            for (let i = lowerPoints.length - 1; i >= 0; i--) {
                ctx.lineTo(lowerPoints[i].x, lowerPoints[i].y);
            }
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }

        const middleValues = computedData.map(d => d ? d.middle : null);
        const upperValues = computedData.map(d => d ? d.upper : null);
        const lowerValues = computedData.map(d => d ? d.lower : null);

        this._drawLine(ctx, upperValues, timeScale, priceScale, color, lineWidth, lineStyle);
        this._drawLine(ctx, middleValues, timeScale, priceScale, color, lineWidth, lineStyle);
        this._drawLine(ctx, lowerValues, timeScale, priceScale, color, lineWidth, lineStyle);
    }
}
