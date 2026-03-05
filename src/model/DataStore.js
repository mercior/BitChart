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
}
