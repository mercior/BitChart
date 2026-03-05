import { DRAWING_TOOLS, SIZES } from '../constants.js';
import { LineDrawing } from '../drawings/LineDrawing.js';
import { ExtendedLineDrawing } from '../drawings/ExtendedLineDrawing.js';
import { HorizontalLineDrawing } from '../drawings/HorizontalLineDrawing.js';
import { TextDrawing } from '../drawings/TextDrawing.js';

export class DrawingToolHandler {
    constructor(chart) {
        this._chart = chart;
        this._state = 'idle';
        this._pendingDrawing = null;
        this._dragInfo = null;
        this._skipNextClick = false;
        this._clonedOnThisDrag = false;
    }

    get state() { return this._state; }

    _getTimePrice(e) {
        const rect = this._chart.layout.uiCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const ts = this._chart.timeScale;
        const ps = this._chart.priceScale;
        const timeIndex = ts.xToIndex(x);
        const price = ps.yToPrice(y);
        const candle = this._chart.dataStore.getCandle(Math.round(timeIndex));
        return { time: candle ? candle.time : timeIndex, price, x, y, index: timeIndex };
    }

    onMouseDown(e) {
        const dm = this._chart.drawingManager;
        const tool = dm.activeTool;

        if (this._state === 'placing' && this._pendingDrawing) {
            const tp = this._getTimePrice(e);
            this._pendingDrawing.finalizePlacement(tp.index, tp.price);
            this._pendingDrawing = null;
            this._state = 'idle';
            dm.setActiveTool(DRAWING_TOOLS.POINTER);
            dm.emit('drawingsChanged');
            this._skipNextClick = true;
            return true;
        }

        if (this._state === 'idle' && tool && tool !== DRAWING_TOOLS.POINTER) {
            this._skipNextClick = true;
            return this._startPlacement(e, tool);
        }

        if (this._state === 'idle' || this._state === 'selected') {
            return this._trySelect(e);
        }

        return false;
    }

    onMouseMove(e) {
        if (this._state === 'placing' && this._pendingDrawing) {
            const tp = this._getTimePrice(e);
            this._pendingDrawing.updatePendingAnchor(tp.index, tp.price);
            this._chart.drawingManager.emit('drawingsChanged');
            return true;
        }

        if (this._state === 'dragging' && this._dragInfo) {
            const tp = this._getTimePrice(e);
            const dm = this._chart.drawingManager;

            // Ctrl+drag to clone (only once per drag)
            if (e.ctrlKey && !this._clonedOnThisDrag) {
                this._cloneSelectedDrawings();
                this._clonedOnThisDrag = true;
            }

            const dt = tp.index - this._dragInfo.lastTime;
            const dp = tp.price - this._dragInfo.lastPrice;

            if (this._dragInfo.anchorIndex !== null && dm.selectedDrawings.length === 1) {
                const drawing = dm.selectedDrawings[0];
                drawing.moveAnchor(this._dragInfo.anchorIndex, tp.index, tp.price);
            } else {
                for (const d of dm.selectedDrawings) {
                    d.moveAll(dt, dp);
                }
            }
            this._dragInfo.lastTime = tp.index;
            this._dragInfo.lastPrice = tp.price;
            dm.emit('drawingsChanged');
            return true;
        }

        // Hover detection
        if (this._state === 'idle' || this._state === 'selected') {
            const dm = this._chart.drawingManager;
            if (!dm.drawingsVisible) return false;
            if (dm.activeTool && dm.activeTool !== DRAWING_TOOLS.POINTER) return false;

            const rect = this._chart.layout.uiCanvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            let hovered = false;
            for (const d of dm.drawings) {
                const wasHovered = d.isHovered;
                d.isHovered = d.hitTest(x, y, this._chart.timeScale, this._chart.priceScale);
                if (d.isHovered) hovered = true;
                if (wasHovered !== d.isHovered) {
                    dm.emit('drawingsChanged');
                }
            }
            this._chart.layout.uiCanvas.style.cursor = hovered ? 'pointer' : 'crosshair';
        }

        return false;
    }

    onMouseUp(e) {
        if (this._state === 'dragging') {
            this._state = this._chart.drawingManager.selectedDrawings.length > 0 ? 'selected' : 'idle';
            this._dragInfo = null;
            this._clonedOnThisDrag = false;
            return true;
        }
        return false;
    }

    onKeyDown(e) {
        const dm = this._chart.drawingManager;
        if ((e.key === 'Delete' || e.key === 'Backspace') && dm.selectedDrawings.length > 0) {
            dm.removeSelected();
            this._state = 'idle';
            return true;
        }
        if (e.key === 'Escape') {
            if (this._state === 'placing') {
                if (this._pendingDrawing) {
                    dm.removeDrawing(this._pendingDrawing.id);
                }
                this._pendingDrawing = null;
                this._state = 'idle';
                dm.setActiveTool(DRAWING_TOOLS.POINTER);
                return true;
            }
            dm.deselectAll();
            dm.setActiveTool(DRAWING_TOOLS.POINTER);
            this._state = 'idle';
            return true;
        }
        return false;
    }

    _startPlacement(e, tool) {
        const tp = this._getTimePrice(e);
        let drawing;

        switch (tool) {
            case DRAWING_TOOLS.LINE:
                drawing = new LineDrawing(tp.index, tp.price);
                break;
            case DRAWING_TOOLS.EXTENDED_LINE:
                drawing = new ExtendedLineDrawing(tp.index, tp.price);
                break;
            case DRAWING_TOOLS.HORIZONTAL_LINE:
                drawing = new HorizontalLineDrawing(tp.price);
                this._chart.drawingManager.addDrawing(drawing);
                this._chart.drawingManager.setActiveTool(DRAWING_TOOLS.POINTER);
                this._state = 'idle';
                return true;
            case DRAWING_TOOLS.TEXT: {
                this._chart.drawingManager.setActiveTool(DRAWING_TOOLS.POINTER);
                this._state = 'idle';
                if (this._chart.textInputDialog) {
                    this._chart.textInputDialog.show('', 'Enter Text').then((text) => {
                        if (text) {
                            const d = new TextDrawing(tp.index, tp.price, text);
                            this._chart.drawingManager.addDrawing(d);
                        }
                    });
                }
                return true;
            }
            default:
                return false;
        }

        this._pendingDrawing = drawing;
        this._chart.drawingManager.addDrawing(drawing);
        this._state = 'placing';
        return true;
    }

    _trySelect(e) {
        const dm = this._chart.drawingManager;
        if (!dm.drawingsVisible) {
            dm.deselectAll();
            this._state = 'idle';
            return false;
        }

        const rect = this._chart.layout.uiCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const ts = this._chart.timeScale;
        const ps = this._chart.priceScale;
        const isCtrl = e.ctrlKey;

        // Check anchor handles of single-selected drawing first
        if (dm.selectedDrawings.length === 1) {
            const sel = dm.selectedDrawings[0];
            if (!sel.isLocked) {
                const handles = sel.getAnchorHandles(ts, ps);
                for (let i = 0; i < handles.length; i++) {
                    const h = handles[i];
                    const dist = Math.hypot(x - h.x, y - h.y);
                    if (dist < SIZES.hitTestTolerance + 2) {
                        this._state = 'dragging';
                        const tp = this._getTimePrice(e);
                        this._dragInfo = {
                            anchorIndex: i,
                            lastTime: tp.index,
                            lastPrice: tp.price,
                        };
                        this._clonedOnThisDrag = false;
                        return true;
                    }
                }
            }
        }

        // Hit test all drawings
        for (let i = dm.drawings.length - 1; i >= 0; i--) {
            const d = dm.drawings[i];
            if (d.hitTest(x, y, ts, ps)) {
                if (isCtrl && !d.isSelected) {
                    dm.selectDrawing(d, true);
                } else if (!isCtrl) {
                    dm.selectDrawing(d, false);
                }
                // Start dragging unless locked
                if (!d.isLocked) {
                    this._state = 'dragging';
                    const tp = this._getTimePrice(e);
                    this._dragInfo = {
                        anchorIndex: null,
                        lastTime: tp.index,
                        lastPrice: tp.price,
                    };
                    this._clonedOnThisDrag = false;
                } else {
                    this._state = dm.selectedDrawings.length > 0 ? 'selected' : 'idle';
                }
                return true;
            }
        }

        dm.deselectAll();
        this._state = 'idle';
        return false;
    }

    _cloneSelectedDrawings() {
        const dm = this._chart.drawingManager;
        const originals = [...dm.selectedDrawings];
        const clones = [];
        for (const d of originals) {
            try {
                const clone = d.clone();
                dm.addDrawing(clone);
                clones.push(clone);
            } catch (err) {
                // clone not implemented for this type
            }
        }
        if (clones.length > 0) {
            // Deselect originals, select clones (we'll be dragging the clones now)
            dm.deselectAll();
            for (const c of clones) {
                dm.selectDrawing(c, true);
            }
        }
    }

    onPlacementClick(e) {
        if (this._skipNextClick) {
            this._skipNextClick = false;
            return true;
        }
        return false;
    }
}
