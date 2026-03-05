import { COLORS } from '../constants.js';

export class CrosshairRenderer {
    constructor(chart) {
        this._chart = chart;
    }

    draw() {
        const ctx = this._chart.layout.uiCtx;
        const w = this._chart.layout.chartWidth;
        const h = this._chart.layout.chartHeight;
        if (!ctx || w < 1 || h < 1) return;

        ctx.clearRect(0, 0, w, h);

        const ch = this._chart.crosshair;
        if (!ch.visible) return;

        ctx.strokeStyle = COLORS.crosshair;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 3]);

        // Vertical line
        ctx.beginPath();
        ctx.moveTo(Math.round(ch.x) + 0.5, 0);
        ctx.lineTo(Math.round(ch.x) + 0.5, h);
        ctx.stroke();

        // Horizontal line
        ctx.beginPath();
        ctx.moveTo(0, Math.round(ch.y) + 0.5);
        ctx.lineTo(w, Math.round(ch.y) + 0.5);
        ctx.stroke();

        ctx.setLineDash([]);

        // Draw OHLC info bar
        this._drawOhlcInfo();

        // Draw selection handles for drawings
        this._drawSelectionHandles(ctx);
    }

    _drawOhlcInfo() {
        const ch = this._chart.crosshair;
        const ohlcBar = this._chart.layout.ohlcBarElement;
        if (!ohlcBar) return;

        if (!ch.visible || ch.candleIndex === null) {
            ohlcBar.innerHTML = '';
            return;
        }

        const candle = this._chart.dataStore.getCandle(ch.candleIndex);
        if (!candle) {
            ohlcBar.innerHTML = '';
            return;
        }

        const isUp = candle.close >= candle.open;
        const color = isUp ? COLORS.candleUp : COLORS.candleDown;
        const fmt = (v) => v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

        ohlcBar.innerHTML =
            `<span style="color:${COLORS.textSecondary}">O</span> <span style="color:${color}">${fmt(candle.open)}</span> ` +
            `<span style="color:${COLORS.textSecondary}">H</span> <span style="color:${color}">${fmt(candle.high)}</span> ` +
            `<span style="color:${COLORS.textSecondary}">L</span> <span style="color:${color}">${fmt(candle.low)}</span> ` +
            `<span style="color:${COLORS.textSecondary}">C</span> <span style="color:${color}">${fmt(candle.close)}</span> ` +
            `<span style="color:${COLORS.textSecondary}">V</span> <span style="color:${color}">${fmt(candle.volume || 0)}</span>`;
    }

    _drawSelectionHandles(ctx) {
        const dm = this._chart.drawingManager;
        if (dm.selectedDrawings.length === 0 || !dm.drawingsVisible) return;

        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = COLORS.selectionHandle;
        ctx.lineWidth = 2;
        const r = 4;

        for (const drawing of dm.selectedDrawings) {
            const handles = drawing.getAnchorHandles(this._chart.timeScale, this._chart.priceScale);
            for (const handle of handles) {
                ctx.beginPath();
                ctx.arc(handle.x, handle.y, r, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            }

            if (drawing.isLocked) {
                ctx.strokeStyle = '#ef5350';
                ctx.lineWidth = 1.5;
                for (const handle of handles) {
                    ctx.beginPath();
                    ctx.moveTo(handle.x - 5, handle.y - 5);
                    ctx.lineTo(handle.x + 5, handle.y + 5);
                    ctx.moveTo(handle.x + 5, handle.y - 5);
                    ctx.lineTo(handle.x - 5, handle.y + 5);
                    ctx.stroke();
                }
                ctx.strokeStyle = COLORS.selectionHandle;
                ctx.lineWidth = 2;
            }
        }
    }
}
