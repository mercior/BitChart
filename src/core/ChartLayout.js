import { COLORS, SIZES } from '../constants.js';
import { setupCanvasSize } from '../utils.js';

export class ChartLayout {
    constructor(container) {
        this._container = container;
        this._buildDOM();
        this.resize();
    }

    _buildDOM() {
        this._container.style.position = 'relative';
        this._container.style.overflow = 'hidden';
        this._container.style.backgroundColor = COLORS.background;

        // Top toolbar (full width)
        this._topToolbarEl = document.createElement('div');
        this._topToolbarEl.className = 'btc-top-toolbar';
        this._container.appendChild(this._topToolbarEl);

        // Toolbar (left)
        this._toolbarEl = document.createElement('div');
        this._toolbarEl.className = 'btc-chart-toolbar';
        this._container.appendChild(this._toolbarEl);

        // Chart area wrapper (holds layered canvases)
        this._chartArea = document.createElement('div');
        this._chartArea.className = 'btc-chart-area';
        this._container.appendChild(this._chartArea);

        // Three layered canvases
        this.bgCanvas = this._createCanvas('btc-canvas-bg');
        this.mainCanvas = this._createCanvas('btc-canvas-main');
        this.uiCanvas = this._createCanvas('btc-canvas-ui');
        this._chartArea.appendChild(this.bgCanvas);
        this._chartArea.appendChild(this.mainCanvas);
        this._chartArea.appendChild(this.uiCanvas);

        // Price axis (right)
        this._priceAxisArea = document.createElement('div');
        this._priceAxisArea.className = 'btc-price-axis';
        this._container.appendChild(this._priceAxisArea);

        this.priceAxisCanvas = document.createElement('canvas');
        this.priceAxisCanvas.style.display = 'block';
        this._priceAxisArea.appendChild(this.priceAxisCanvas);

        // Time axis (bottom, spans chart + price axis)
        this._timeAxisArea = document.createElement('div');
        this._timeAxisArea.className = 'btc-time-axis';
        this._container.appendChild(this._timeAxisArea);

        this.timeAxisCanvas = document.createElement('canvas');
        this.timeAxisCanvas.style.display = 'block';
        this._timeAxisArea.appendChild(this.timeAxisCanvas);

        // OHLC info bar (top of chart area)
        this._ohlcBar = document.createElement('div');
        this._ohlcBar.className = 'btc-ohlc-bar';
        this._chartArea.appendChild(this._ohlcBar);
    }

    _createCanvas(className) {
        const canvas = document.createElement('canvas');
        canvas.className = className;
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';
        return canvas;
    }

    get topToolbarElement() {
        return this._topToolbarEl;
    }

    get toolbarElement() {
        return this._toolbarEl;
    }

    get ohlcBarElement() {
        return this._ohlcBar;
    }

    get chartWidth() {
        return this._chartW || 0;
    }

    get chartHeight() {
        return this._chartH || 0;
    }

    get containerWidth() {
        return this._container.clientWidth;
    }

    get containerHeight() {
        return this._container.clientHeight;
    }

    resize() {
        const cw = this._container.clientWidth;
        const ch = this._container.clientHeight;
        const topH = SIZES.topToolbarHeight;

        this._chartW = cw - SIZES.toolbarWidth - SIZES.priceAxisWidth;
        this._chartH = ch - SIZES.timeAxisHeight - topH;

        if (this._chartW < 1 || this._chartH < 1) return;

        // Position top toolbar
        this._topToolbarEl.style.width = `${cw}px`;
        this._topToolbarEl.style.height = `${topH}px`;

        // Position toolbar
        this._toolbarEl.style.top = `${topH}px`;
        this._toolbarEl.style.width = `${SIZES.toolbarWidth}px`;
        this._toolbarEl.style.height = `${this._chartH}px`;

        // Position chart area
        this._chartArea.style.left = `${SIZES.toolbarWidth}px`;
        this._chartArea.style.top = `${topH}px`;
        this._chartArea.style.width = `${this._chartW}px`;
        this._chartArea.style.height = `${this._chartH}px`;

        // Resize layered canvases
        this.bgCtx = setupCanvasSize(this.bgCanvas, this._chartW, this._chartH);
        this.mainCtx = setupCanvasSize(this.mainCanvas, this._chartW, this._chartH);
        this.uiCtx = setupCanvasSize(this.uiCanvas, this._chartW, this._chartH);

        // Position and resize price axis
        this._priceAxisArea.style.left = `${SIZES.toolbarWidth + this._chartW}px`;
        this._priceAxisArea.style.top = `${topH}px`;
        this._priceAxisArea.style.width = `${SIZES.priceAxisWidth}px`;
        this._priceAxisArea.style.height = `${this._chartH}px`;
        this.priceAxisCtx = setupCanvasSize(this.priceAxisCanvas, SIZES.priceAxisWidth, this._chartH);

        // Position and resize time axis
        this._timeAxisArea.style.left = `${SIZES.toolbarWidth}px`;
        this._timeAxisArea.style.top = `${topH + this._chartH}px`;
        this._timeAxisArea.style.width = `${this._chartW + SIZES.priceAxisWidth}px`;
        this._timeAxisArea.style.height = `${SIZES.timeAxisHeight}px`;
        this.timeAxisCtx = setupCanvasSize(this.timeAxisCanvas, this._chartW + SIZES.priceAxisWidth, SIZES.timeAxisHeight);
    }

    destroy() {
        this._container.innerHTML = '';
    }
}
