export class RenderScheduler {
    _dirty = { bg: true, main: true, ui: true, priceAxis: true, timeAxis: true };
    _rafId = null;
    _running = false;
    _renderers = {};

    registerRenderer(layer, renderer) {
        if (!this._renderers[layer]) {
            this._renderers[layer] = [];
        }
        this._renderers[layer].push(renderer);
    }

    invalidate(layer) {
        if (layer === 'all') {
            for (const key in this._dirty) this._dirty[key] = true;
        } else {
            this._dirty[layer] = true;
        }
        this._scheduleFrame();
    }

    start() {
        this._running = true;
        this._scheduleFrame();
    }

    stop() {
        this._running = false;
        if (this._rafId !== null) {
            cancelAnimationFrame(this._rafId);
            this._rafId = null;
        }
    }

    _scheduleFrame() {
        if (!this._running) return;
        if (this._rafId !== null) return;
        this._rafId = requestAnimationFrame(() => {
            this._rafId = null;
            this._renderFrame();
        });
    }

    _renderFrame() {
        for (const layer in this._dirty) {
            if (this._dirty[layer] && this._renderers[layer]) {
                for (const renderer of this._renderers[layer]) {
                    renderer.draw();
                }
                this._dirty[layer] = false;
            }
        }
    }
}
