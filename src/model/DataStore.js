import { EventEmitter } from '../core/EventEmitter.js';

export class DataStore extends EventEmitter {
    _candles = [];

    get length() {
        return this._candles.length;
    }

    get last() {
        return this._candles[this._candles.length - 1] || null;
    }

    setData(candles) {
        this._candles = candles.slice();
        this.emit('dataChanged');
    }

    append(candles) {
        this._candles.push(...candles);
        this.emit('dataChanged');
    }

    update(candle) {
        if (this._candles.length === 0) {
            this._candles.push(candle);
            this.emit('dataChanged');
            return;
        }

        const last = this._candles[this._candles.length - 1];
        if (candle.time === last.time) {
            this._candles[this._candles.length - 1] = candle;
        } else {
            this._candles.push(candle);
        }
        this.emit('dataChanged');
    }

    getRange(startIdx, endIdx) {
        const from = Math.max(0, Math.floor(startIdx));
        const to = Math.min(this._candles.length, Math.ceil(endIdx) + 1);
        return this._candles.slice(from, to);
    }

    getCandle(index) {
        return this._candles[index] || null;
    }

    getAll() {
        return this._candles;
    }

    indexToTime(index) {
        return this.getTimeForIndex(index);
    }

    timeToIndex(timestamp) {
        if (this._candles.length === 0) return 0;
        if (this._candles.length === 1) {
            return timestamp === this._candles[0].time ? 0 : 0;
        }

        const first = this._candles[0];
        const last = this._candles[this._candles.length - 1];

        if (timestamp <= first.time) {
            const interval = this.getCandleInterval();
            return (timestamp - first.time) / interval;
        }
        if (timestamp >= last.time) {
            const interval = this.getCandleInterval();
            return (this._candles.length - 1) + (timestamp - last.time) / interval;
        }

        let lo = 0, hi = this._candles.length - 1;
        while (lo < hi - 1) {
            const mid = (lo + hi) >> 1;
            if (this._candles[mid].time <= timestamp) {
                lo = mid;
            } else {
                hi = mid;
            }
        }
        const t0 = this._candles[lo].time;
        const t1 = this._candles[hi].time;
        if (t1 === t0) return lo;
        return lo + (timestamp - t0) / (t1 - t0);
    }

    getCandleInterval() {
        if (this._explicitInterval) return this._explicitInterval;
        if (this._candles.length < 2) return 60;
        const last = this._candles[this._candles.length - 1];
        const prev = this._candles[this._candles.length - 2];
        return last.time - prev.time;
    }

    setCandleInterval(interval) {
        this._explicitInterval = interval;
    }

    getTimeForIndex(index) {
        if (index >= 0 && index < this._candles.length) {
            const floored = Math.floor(index);
            const candle = this._candles[floored];
            if (floored === index || floored + 1 >= this._candles.length) {
                return candle.time;
            }
            const next = this._candles[floored + 1];
            const frac = index - floored;
            return candle.time + (next.time - candle.time) * frac;
        }

        if (this._candles.length === 0) return 0;

        const interval = this.getCandleInterval();
        if (index >= this._candles.length) {
            const last = this._candles[this._candles.length - 1];
            return last.time + (index - (this._candles.length - 1)) * interval;
        }
        const first = this._candles[0];
        return first.time + index * interval;
    }
}
