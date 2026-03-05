import { EventEmitter } from '../core/EventEmitter.js';

export class Crosshair extends EventEmitter {
    _x = -1;
    _y = -1;
    _visible = false;
    _price = null;
    _time = null;
    _candleIndex = null;

    get x() { return this._x; }
    get y() { return this._y; }
    get visible() { return this._visible; }
    get price() { return this._price; }
    get time() { return this._time; }
    get candleIndex() { return this._candleIndex; }

    update(x, y, price, time, candleIndex) {
        this._x = x;
        this._y = y;
        this._price = price;
        this._time = time;
        this._candleIndex = candleIndex;
        this._visible = true;
        this.emit('crosshairMoved');
    }

    hide() {
        if (!this._visible) return;
        this._visible = false;
        this.emit('crosshairMoved');
    }
}
