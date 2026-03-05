export class EventEmitter {
    _listeners = new Map();

    on(event, callback) {
        if (!this._listeners.has(event)) {
            this._listeners.set(event, []);
        }
        this._listeners.get(event).push(callback);
        return this;
    }

    off(event, callback) {
        const list = this._listeners.get(event);
        if (!list) return this;
        const idx = list.indexOf(callback);
        if (idx !== -1) list.splice(idx, 1);
        return this;
    }

    emit(event, ...args) {
        const list = this._listeners.get(event);
        if (!list) return;
        for (const cb of list) {
            cb(...args);
        }
    }

    removeAllListeners() {
        this._listeners.clear();
    }
}
