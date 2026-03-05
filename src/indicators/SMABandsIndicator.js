import { IndicatorBase } from './IndicatorBase.js';

const BAND_COLORS = [
    '#ffca28', '#ffb74d', '#ff9800', '#f44336',
    '#42a5f5', '#66bb6a', '#ab47bc', '#26a69a',
];

function computeSMA(candles, period, source) {
    const len = candles.length;
    const result = new Array(len).fill(null);
    if (len < period) return result;
    let sum = 0;
    for (let i = 0; i < period; i++) sum += candles[i][source];
    result[period - 1] = sum / period;
    for (let i = period; i < len; i++) {
        sum += candles[i][source] - candles[i - period][source];
        result[i] = sum / period;
    }
    return result;
}

function computeEMA(candles, period, source) {
    const len = candles.length;
    const result = new Array(len).fill(null);
    if (len < period) return result;
    let sum = 0;
    for (let i = 0; i < period; i++) sum += candles[i][source];
    result[period - 1] = sum / period;
    const k = 2 / (period + 1);
    for (let i = period; i < len; i++) {
        result[i] = (candles[i][source] - result[i - 1]) * k + result[i - 1];
    }
    return result;
}

export class SMABandsIndicator extends IndicatorBase {
    static get indicatorName() { return 'MA Ribbon'; }
    static get shortName() { return 'MAR'; }

    static get settingsConfig() {
        const bands = [];
        const defaults = [
            { period: 20,  color: BAND_COLORS[0] },
            { period: 50,  color: BAND_COLORS[1] },
            { period: 100, color: BAND_COLORS[2] },
            { period: 200, color: BAND_COLORS[3] },
            { period: 10,  color: BAND_COLORS[4], enabled: false },
            { period: 30,  color: BAND_COLORS[5], enabled: false },
            { period: 75,  color: BAND_COLORS[6], enabled: false },
            { period: 150, color: BAND_COLORS[7], enabled: false },
        ];
        for (let i = 0; i < 8; i++) {
            const d = defaults[i];
            bands.push({
                key: `ma${i + 1}`,
                label: `MA #${i + 1}`,
                type: 'maLine',
                default: {
                    enabled: d.enabled !== false,
                    type: 'SMA',
                    source: 'close',
                    period: d.period,
                    color: d.color,
                },
                tab: 'inputs',
            });
        }
        bands.push({ key: 'timeframe', label: 'Timeframe', type: 'timeframe', default: 'chart', tab: 'inputs', group: 'Calculation' });
        bands.push({ key: 'lineWidth', label: 'Line Width', type: 'number', default: 1.5, min: 0.5, max: 5, step: 0.5, tab: 'style' });
        bands.push({ key: 'lineStyle', label: 'Line Style', type: 'lineStyle', default: 'solid', tab: 'style' });
        return bands;
    }

    getLegendText() {
        const active = [];
        for (let i = 1; i <= 8; i++) {
            const ma = this.settings[`ma${i}`];
            if (ma && ma.enabled) active.push(ma.period);
        }
        return `MAR (${active.join(', ')})`;
    }

    compute(candles) {
        const result = {};
        for (let i = 1; i <= 8; i++) {
            const ma = this.settings[`ma${i}`];
            if (!ma || !ma.enabled) {
                result[`ma${i}`] = null;
                continue;
            }
            const fn = ma.type === 'EMA' ? computeEMA : computeSMA;
            result[`ma${i}`] = fn(candles, ma.period, ma.source || 'close');
        }
        return result;
    }

    draw(ctx, computedData, timeScale, priceScale) {
        if (!this.visible || !computedData) return;
        const { lineWidth, lineStyle } = this.settings;

        for (let i = 1; i <= 8; i++) {
            const ma = this.settings[`ma${i}`];
            const values = computedData[`ma${i}`];
            if (!ma || !ma.enabled || !values) continue;
            this._drawLine(ctx, values, timeScale, priceScale, ma.color, lineWidth, lineStyle);
        }
    }
}
