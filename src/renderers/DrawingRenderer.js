export class DrawingRenderer {
    constructor(chart) {
        this._chart = chart;
    }

    draw() {
        const ctx = this._chart.layout.mainCtx;
        if (!ctx) return;

        const dm = this._chart.drawingManager;
        if (!dm.drawingsVisible) return;

        const ts = this._chart.timeScale;
        const ps = this._chart.priceScale;

        for (const drawing of dm.drawings) {
            drawing.draw(ctx, ts, ps);
        }
    }
}
