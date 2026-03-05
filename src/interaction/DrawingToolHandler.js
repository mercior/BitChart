import { DRAWING_TOOLS, SIZES } from '../constants.js';
import { LineDrawing } from '../drawings/LineDrawing.js';
import { ExtendedLineDrawing } from '../drawings/ExtendedLineDrawing.js';
import { HorizontalLineDrawing } from '../drawings/HorizontalLineDrawing.js';
import { TextDrawing } from '../drawings/TextDrawing.js';
import { RectangleDrawing } from '../drawings/RectangleDrawing.js';
import { TriangleDrawing } from '../drawings/TriangleDrawing.js';
import { CircleDrawing } from '../drawings/CircleDrawing.js';
import { PolygonDrawing } from '../drawings/PolygonDrawing.js';
import { LongPositionDrawing } from '../drawings/LongPositionDrawing.js';
import { ShortPositionDrawing } from '../drawings/ShortPositionDrawing.js';

const TWO_CLICK_TOOLS = new Set([
    DRAWING_TOOLS.LINE, DRAWING_TOOLS.EXTENDED_LINE,
    DRAWING_TOOLS.RECTANGLE, DRAWING_TOOLS.CIRCLE,
    DRAWING_TOOLS.LONG_POSITION, DRAWING_TOOLS.SHORT_POSITION,
]);

export class DrawingToolHandler {
    constructor(chart) {
        this._chart = chart;
        this._state = 'idle';
        this._pendingDrawing = null;
        this._dragInfo = null;
        this._skipNextClick = false;
        this._clonedOnThisDrag = false;
        this._lastClickTime = 0;
    }

    get state() { return this._state; }

    _getTimePrice(e, snap) {
        const rect = this._chart.layout.uiCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const ts = this._chart.timeScale;
        const ps = this._chart.priceScale;
        let timeIndex = ts.xToIndex(x);
        let price = ps.yToPrice(y);
        if (snap) {
            const s = this._snapToCandle(timeIndex, price);
            timeIndex = s.time;
            price = s.price;
        }
        const candle = this._chart.dataStore.getCandle(Math.round(timeIndex));
        return { time: candle ? candle.time : timeIndex, price, x, y, index: timeIndex };
    }

    onMouseDown(e) {
        const dm = this._chart.drawingManager;
        const tool = dm.activeTool;
        const now = Date.now();
        const isDoubleClick = (now - this._lastClickTime) < 350;
        this._lastClickTime = now;

        // Polygon placement
        if (this._state === 'placing' && this._pendingDrawing &&
            this._pendingDrawing.type === 'polygon') {
            if (isDoubleClick && this._pendingDrawing.anchors.length >= 3) {
                this._pendingDrawing.finalizePlacement();
                this._pendingDrawing = null;
                this._state = 'idle';
                dm.setActiveTool(DRAWING_TOOLS.POINTER);
                dm.emit('drawingsChanged');
                this._skipNextClick = true;
                return true;
            }
            const tp = this._getTimePrice(e, e.ctrlKey);
            this._pendingDrawing.addPoint(tp.index, tp.price);
            dm.emit('drawingsChanged');
            this._skipNextClick = true;
            return true;
        }

        // Triangle: multi-step placement
        if (this._state === 'placing' && this._pendingDrawing &&
            this._pendingDrawing.type === 'triangle') {
            const tp = this._getTimePrice(e, e.ctrlKey);
            const done = this._pendingDrawing.advancePlacement(tp.index, tp.price);
            if (done) {
                this._pendingDrawing = null;
                this._state = 'idle';
                dm.setActiveTool(DRAWING_TOOLS.POINTER);
            }
            dm.emit('drawingsChanged');
            this._skipNextClick = true;
            return true;
        }

        // Standard 2-click tools: finalize on second click
        if (this._state === 'placing' && this._pendingDrawing) {
            const tp = this._getTimePrice(e, e.ctrlKey);
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

    _snapToCandle(timeIndex, price) {
        const snappedIndex = Math.round(timeIndex);
        const candle = this._chart.dataStore.getCandle(snappedIndex);
        if (!candle) return { time: snappedIndex, price };
        const distHigh = Math.abs(price - candle.high);
        const distLow = Math.abs(price - candle.low);
        const distOpen = Math.abs(price - candle.open);
        const distClose = Math.abs(price - candle.close);
        const min = Math.min(distHigh, distLow, distOpen, distClose);
        let snappedPrice = candle.close;
        if (min === distHigh) snappedPrice = candle.high;
        else if (min === distLow) snappedPrice = candle.low;
        else if (min === distOpen) snappedPrice = candle.open;
        return { time: snappedIndex, price: snappedPrice };
    }

    onMouseMove(e) {
        if (this._state === 'placing' && this._pendingDrawing) {
            const tp = this._getTimePrice(e, e.ctrlKey);
            this._pendingDrawing.updatePendingAnchor(tp.index, tp.price);
            this._chart.drawingManager.emit('drawingsChanged');
            return true;
        }

        if (this._state === 'dragging' && this._dragInfo) {
            const snapDrag = e.ctrlKey && !this._dragInfo.ctrlAtStart;
            const tp = this._getTimePrice(e, snapDrag);
            const dm = this._chart.drawingManager;

            if (this._dragInfo.ctrlAtStart && !this._clonedOnThisDrag) {
                this._cloneSelectedDrawings();
                this._clonedOnThisDrag = true;
            }

            let dragTime = tp.index;
            let dragPrice = tp.price;

            const dt = dragTime - this._dragInfo.lastTime;
            const dp = dragPrice - this._dragInfo.lastPrice;

            if (this._dragInfo.anchorIndex !== null && dm.selectedDrawings.length === 1) {
                const drawing = dm.selectedDrawings[0];
                drawing.moveAnchor(this._dragInfo.anchorIndex, dragTime, dragPrice);
            } else {
                for (const d of dm.selectedDrawings) {
                    d.moveAll(dt, dp);
                }
            }
            this._dragInfo.lastTime = dragTime;
            this._dragInfo.lastPrice = dragPrice;
            dm.emit('drawingsChanged');
            return true;
        }

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
        // Enter to finalize polygon
        if (e.key === 'Enter' && this._state === 'placing' &&
            this._pendingDrawing && this._pendingDrawing.type === 'polygon') {
            if (this._pendingDrawing.anchors.length >= 3) {
                this._pendingDrawing.finalizePlacement();
                this._pendingDrawing = null;
                this._state = 'idle';
                dm.setActiveTool(DRAWING_TOOLS.POINTER);
                dm.emit('drawingsChanged');
            }
            return true;
        }
        return false;
    }

    _startPlacement(e, tool) {
        const tp = this._getTimePrice(e, e.ctrlKey);
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
            case DRAWING_TOOLS.RECTANGLE:
                drawing = new RectangleDrawing(tp.index, tp.price);
                break;
            case DRAWING_TOOLS.CIRCLE:
                drawing = new CircleDrawing(tp.index, tp.price);
                break;
            case DRAWING_TOOLS.TRIANGLE:
                drawing = new TriangleDrawing(tp.index, tp.price);
                break;
            case DRAWING_TOOLS.POLYGON:
                drawing = new PolygonDrawing(tp.index, tp.price);
                break;
            case DRAWING_TOOLS.LONG_POSITION:
                drawing = new LongPositionDrawing(tp.index, tp.price);
                break;
            case DRAWING_TOOLS.SHORT_POSITION:
                drawing = new ShortPositionDrawing(tp.index, tp.price);
                break;
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
                            ctrlAtStart: e.ctrlKey,
                        };
                        this._clonedOnThisDrag = false;
                        return true;
                    }
                }
            }
        }

        for (let i = dm.drawings.length - 1; i >= 0; i--) {
            const d = dm.drawings[i];
            if (d.hitTest(x, y, ts, ps)) {
                if (isCtrl && !d.isSelected) {
                    dm.selectDrawing(d, true);
                } else if (!isCtrl) {
                    dm.selectDrawing(d, false);
                }
                if (!d.isLocked) {
                    this._state = 'dragging';
                    const tp = this._getTimePrice(e);
                    this._dragInfo = {
                        anchorIndex: null,
                        lastTime: tp.index,
                        lastPrice: tp.price,
                        ctrlAtStart: e.ctrlKey,
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
