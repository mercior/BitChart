import { IndicatorBase, nextDefaultColor } from './IndicatorBase.js';

export class EMAIndicator extends IndicatorBase {
    static get indicatorName() { return 'Moving Average (EMA)'; }
    static get shortName() { return 'MA'; }

    static get settingsConfig() {
        return [
            { key: 'period', label: 'Period', type: 'number', default: 20, min: 1, max: 500, step: 1, tab: 'inputs' },
            { key: 'source', label: 'Source', type: 'select', default: 'close', options: ['open', 'high', 'low', 'close'], tab: 'inputs' },
            { key: 'timeframe', label: 'Timeframe', type: 'timeframe', default: 'chart', tab: 'inputs', group: 'Calculation' },
            { key: 'color', label: 'Color', type: 'color', default: null, tab: 'style' },
            { key: 'lineWidth', label: 'Line Width', type: 'number', default: 1.5, min: 0.5, max: 5, step: 0.5, tab: 'style' },
            { key: 'lineStyle', label: 'Line Style', type: 'lineStyle', default: 'solid', tab: 'style' },
        ];
    }

    constructor(settings = {}) {
        super(settings);
        if (this.settings.color === null) {
            this.settings.color = nextDefaultColor();
        }
    }

    getLegendText() {
        return `MA (${this.settings.period})`;
    }

    compute(candles) {
        const { period, source } = this.settings;
        const result = new Array(candles.length).fill(null);
        if (candles.length < period) return result;

        let sum = 0;
        for (let i = 0; i < period; i++) {
            sum += candles[i][source];
        }
        result[period - 1] = sum / period;

        const multiplier = 2 / (period + 1);
        for (let i = period; i < candles.length; i++) {
            result[i] = (candles[i][source] - result[i - 1]) * multiplier + result[i - 1];
        }
        return result;
    }

    draw(ctx, computedData, timeScale, priceScale) {
        if (!this.visible) return;
        const { color, lineWidth, lineStyle } = this.settings;
        this._drawLine(ctx, computedData, timeScale, priceScale, color, lineWidth, lineStyle);
    }
}
