import { EventEmitter } from '../core/EventEmitter.js';

const TF_SECONDS = {
    '1m': 60,
    '5m': 300,
    '15m': 900,
    '30m': 1800,
    '1h': 3600,
    '2h': 7200,
    '4h': 14400,
    '1D': 86400,
    '1W': 604800,
};

/**
 * Aggregate chart-level candles into higher-timeframe OHLCV buckets.
 * Returns { aggregated, mapping } where mapping[i] is the aggregated index
 * that original candle i belongs to.
 */
function aggregateCandles(candles, timeframe) {
    const bucketSize = TF_SECONDS[timeframe];
    if (!bucketSize || candles.length === 0) {
        return { aggregated: candles, mapping: candles.map((_, i) => i) };
    }

    const aggregated = [];
    const mapping = new Array(candles.length);
    let currentBucket = -1;
    let aggIdx = -1;

    for (let i = 0; i < candles.length; i++) {
        const c = candles[i];
        const bucket = Math.floor(c.time / bucketSize);

        if (bucket !== currentBucket) {
            currentBucket = bucket;
            aggIdx++;
            aggregated.push({
                time: bucket * bucketSize,
                open: c.open,
                high: c.high,
                low: c.low,
                close: c.close,
                volume: c.volume || 0,
            });
        } else {
            const agg = aggregated[aggIdx];
            if (c.high > agg.high) agg.high = c.high;
            if (c.low < agg.low) agg.low = c.low;
            agg.close = c.close;
            agg.volume += c.volume || 0;
        }
        mapping[i] = aggIdx;
    }

    return { aggregated, mapping };
}

/**
 * Linearly interpolate between two values.
 * Handles plain numbers and objects with numeric fields (e.g. BB {middle, upper, lower}).
 */
function lerpValue(a, b, t) {
    if (typeof a === 'number' && typeof b === 'number') {
        return a + (b - a) * t;
    }
    if (a && b && typeof a === 'object' && typeof b === 'object') {
        const out = {};
        for (const k in a) {
            out[k] = (typeof a[k] === 'number' && typeof b[k] === 'number')
                ? a[k] + (b[k] - a[k]) * t
                : a[k];
        }
        return out;
    }
    return a;
}

/**
 * Build anchor points for smooth interpolation.
 * Each anchor is { origIdx, aggIdx } placed at the last original candle of each bucket.
 */
function buildAnchors(mapping, originalLength) {
    const anchors = [];
    for (let i = 0; i < originalLength; i++) {
        const ai = mapping[i];
        if (i === originalLength - 1 || mapping[i + 1] !== ai) {
            anchors.push({ origIdx: i, aggIdx: ai });
        }
    }
    return anchors;
}

/**
 * Expand a single aggregated array back to original length with smooth interpolation.
 */
function expandArraySmooth(aggArray, anchors, originalLength) {
    const result = new Array(originalLength).fill(null);

    // Place anchor values
    for (const a of anchors) {
        if (aggArray[a.aggIdx] != null) {
            result[a.origIdx] = aggArray[a.aggIdx];
        }
    }

    // Interpolate between consecutive anchors that both have values
    for (let k = 0; k < anchors.length - 1; k++) {
        const a0 = anchors[k];
        const a1 = anchors[k + 1];
        const v0 = aggArray[a0.aggIdx];
        const v1 = aggArray[a1.aggIdx];
        if (v0 == null || v1 == null) continue;

        const span = a1.origIdx - a0.origIdx;
        if (span <= 1) continue;

        for (let i = a0.origIdx + 1; i < a1.origIdx; i++) {
            const t = (i - a0.origIdx) / span;
            result[i] = lerpValue(v0, v1, t);
        }
    }

    // Fill candles before the first valid anchor with that anchor's value
    for (let k = 0; k < anchors.length; k++) {
        const v = aggArray[anchors[k].aggIdx];
        if (v == null) continue;
        // Fill backwards from this anchor to the start of its bucket
        const startIdx = k > 0 ? anchors[k - 1].origIdx + 1 : 0;
        for (let i = startIdx; i < anchors[k].origIdx; i++) {
            if (result[i] == null) result[i] = v;
        }
        break;
    }

    // Fill candles after the last valid anchor with that anchor's value
    for (let k = anchors.length - 1; k >= 0; k--) {
        const v = aggArray[anchors[k].aggIdx];
        if (v == null) continue;
        for (let i = anchors[k].origIdx + 1; i < originalLength; i++) {
            result[i] = v;
        }
        break;
    }

    return result;
}

/**
 * Expand aggregated-index results back to original-candle-index results
 * with smooth linear interpolation between bucket endpoints.
 * Handles: arrays of primitives/objects, and objects-of-arrays (MA Ribbon).
 */
function expandResult(aggResult, mapping, originalLength) {
    const anchors = buildAnchors(mapping, originalLength);

    if (Array.isArray(aggResult)) {
        return expandArraySmooth(aggResult, anchors, originalLength);
    }

    if (aggResult && typeof aggResult === 'object') {
        const expanded = {};
        for (const [key, val] of Object.entries(aggResult)) {
            if (Array.isArray(val)) {
                expanded[key] = expandArraySmooth(val, anchors, originalLength);
            } else {
                expanded[key] = val;
            }
        }
        return expanded;
    }

    return aggResult;
}

/**
 * Manages active indicator instances and their computed data.
 * Emits 'indicatorsChanged' whenever indicators are added/removed/updated.
 */
export class IndicatorManager extends EventEmitter {
    _indicators = [];
    _computedCache = new Map();
    _candles = [];

    get indicators() {
        return this._indicators;
    }

    addIndicator(indicator) {
        this._indicators.push(indicator);
        this._recompute(indicator);
        this.emit('indicatorsChanged');
    }

    removeIndicator(id) {
        this._indicators = this._indicators.filter(ind => ind.id !== id);
        this._computedCache.delete(id);
        this.emit('indicatorsChanged');
    }

    getIndicator(id) {
        return this._indicators.find(ind => ind.id === id) || null;
    }

    toggleVisibility(id) {
        const ind = this.getIndicator(id);
        if (ind) {
            ind.visible = !ind.visible;
            this.emit('indicatorsChanged');
        }
    }

    updateSettings(id, newSettings) {
        const ind = this.getIndicator(id);
        if (!ind) return;
        Object.assign(ind.settings, newSettings);
        this._recompute(ind);
        this.emit('indicatorsChanged');
    }

    getComputedData(id) {
        return this._computedCache.get(id) || null;
    }

    setCandles(candles) {
        this._candles = candles;
        this.recomputeAll();
    }

    recomputeAll() {
        for (const ind of this._indicators) {
            this._recompute(ind);
        }
    }

    _recompute(indicator) {
        if (this._candles.length === 0) {
            this._computedCache.set(indicator.id, null);
            return;
        }

        const tf = indicator.settings.timeframe;
        if (!tf || tf === 'chart') {
            const data = indicator.compute(this._candles);
            this._computedCache.set(indicator.id, data);
            return;
        }

        const { aggregated, mapping } = aggregateCandles(this._candles, tf);
        const aggResult = indicator.compute(aggregated);
        const expanded = expandResult(aggResult, mapping, this._candles.length);
        this._computedCache.set(indicator.id, expanded);
    }
}
