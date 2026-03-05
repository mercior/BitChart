import { uid } from '../utils.js';

const DEFAULT_PALETTE = [
    '#2962ff', '#ff6d00', '#e91e63', '#00bcd4',
    '#ab47bc', '#26a69a', '#ffeb3b', '#ff5252',
    '#42a5f5', '#66bb6a', '#ffa726', '#7e57c2',
];

let _paletteIndex = 0;

/**
 * Pick the next color from the default palette (cycles).
 */
export function nextDefaultColor() {
    const color = DEFAULT_PALETTE[_paletteIndex % DEFAULT_PALETTE.length];
    _paletteIndex++;
    return color;
}

/**
 * Abstract base class for chart indicators.
 *
 * Subclasses must define:
 *   static indicatorName  – human-readable name shown in menus
 *   static shortName      – abbreviated name for the legend (e.g. "SMA")
 *   static settingsConfig – array of setting descriptors
 *   compute(candles)      – returns computed data array
 *   draw(ctx, data, timeScale, priceScale, chartWidth, chartHeight) – renders the indicator
 */
export class IndicatorBase {
    static get indicatorName() { throw new Error('indicatorName must be defined'); }
    static get shortName() { throw new Error('shortName must be defined'); }

    /**
     * Settings config defines the UI for the indicator's settings dialog.
     * Each entry: { key, label, type, default, min?, max?, step?, options? }
     * Types: 'number', 'color', 'select', 'boolean'
     */
    static get settingsConfig() { return []; }

    static defaultSettings() {
        const defaults = {};
        for (const cfg of this.settingsConfig) {
            defaults[cfg.key] = cfg.default;
        }
        return defaults;
    }

    constructor(settings = {}) {
        this.id = uid();
        this.visible = true;
        this.settings = { ...this.constructor.defaultSettings(), ...settings };
        this._computedData = null;
    }

    /**
     * Compute indicator values from the full candle dataset.
     * Returns an array aligned with candle indices (null for insufficient data).
     */
    compute(candles) {
        throw new Error('compute() must be implemented by subclass');
    }

    /**
     * Draw the indicator on the main canvas.
     */
    draw(ctx, computedData, timeScale, priceScale, chartWidth, chartHeight) {
        throw new Error('draw() must be implemented by subclass');
    }

    /**
     * Return text for the legend, e.g. "SMA (20)"
     */
    getLegendText() {
        return this.constructor.shortName;
    }

    /**
     * Draw a continuous line from computed values (price-based).
     * Utility for subclasses that draw simple line overlays.
     */
    _drawLine(ctx, values, timeScale, priceScale, color, lineWidth = 1.5, lineStyle = 'solid') {
        if (!values || values.length === 0) return;

        const range = timeScale.visibleRange();
        if (!range) return;

        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.lineJoin = 'round';

        if (lineStyle === 'dashed') ctx.setLineDash([6, 4]);
        else if (lineStyle === 'dotted') ctx.setLineDash([2, 2]);
        else ctx.setLineDash([]);

        ctx.beginPath();

        let started = false;
        for (let i = range.from; i <= range.to; i++) {
            const val = values[i];
            if (val == null) {
                started = false;
                continue;
            }
            const x = timeScale.indexToX(i);
            const y = priceScale.priceToY(val);
            if (!started) {
                ctx.moveTo(x, y);
                started = true;
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.stroke();
        ctx.restore();
    }
}
