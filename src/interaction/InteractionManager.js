import { PanZoomHandler } from './PanZoomHandler.js';
import { AxisDragHandler } from './AxisDragHandler.js';
import { CrosshairController } from './CrosshairController.js';
import { DrawingToolHandler } from './DrawingToolHandler.js';
import { DRAWING_TOOLS, SIZES } from '../constants.js';

export class InteractionManager {
    constructor(chart) {
        this._chart = chart;
        this._panZoom = new PanZoomHandler(chart);
        this._axisDrag = new AxisDragHandler(chart);
        this._crosshair = new CrosshairController(chart);
        this._drawingTool = new DrawingToolHandler(chart);

        this._bindEvents();
    }

    get drawingToolHandler() {
        return this._drawingTool;
    }

    _bindEvents() {
        const uiCanvas = this._chart.layout.uiCanvas;
        const priceCanvas = this._chart.layout.priceAxisCanvas;
        const timeCanvas = this._chart.layout.timeAxisCanvas;

        // Main chart area events
        this._onMouseDown = (e) => this._handleMouseDown(e);
        this._onMouseMove = (e) => this._handleMouseMove(e);
        this._onMouseUp = (e) => this._handleMouseUp(e);
        this._onWheel = (e) => this._panZoom.onWheel(e);
        this._onMouseLeave = () => this._crosshair.onMouseLeave();
        this._onClick = (e) => this._handleClick(e);
        this._onDblClick = (e) => this._handleDblClick(e);
        this._onKeyDown = (e) => this._handleKeyDown(e);

        uiCanvas.addEventListener('mousedown', this._onMouseDown);
        uiCanvas.addEventListener('mousemove', this._onMouseMove);
        uiCanvas.addEventListener('mouseup', this._onMouseUp);
        uiCanvas.addEventListener('wheel', this._onWheel, { passive: false });
        uiCanvas.addEventListener('mouseleave', this._onMouseLeave);
        uiCanvas.addEventListener('click', this._onClick);
        uiCanvas.addEventListener('dblclick', this._onDblClick);
        document.addEventListener('keydown', this._onKeyDown);

        // Global mouse up (in case mouse leaves canvas during drag)
        this._onGlobalMouseUp = (e) => {
            this._panZoom.onMouseUp(e);
            this._axisDrag.onMouseUp();
            this._drawingTool.onMouseUp(e);
        };
        this._onGlobalMouseMove = (e) => {
            if (this._axisDrag.isDragging) {
                this._axisDrag.onMouseMove(e);
            }
            if (this._panZoom.isPanning) {
                this._panZoom.onMouseMove(e);
            }
            if (this._drawingTool.state === 'dragging') {
                this._drawingTool.onMouseMove(e);
            }
        };
        document.addEventListener('mouseup', this._onGlobalMouseUp);
        document.addEventListener('mousemove', this._onGlobalMouseMove);

        // Price axis events
        this._onPriceAxisDown = (e) => this._axisDrag.tryStartDrag(e, 'priceAxis');
        this._onPriceAxisDblClick = () => {
            this._chart.priceScale.resetAutoScale();
            this._chart._autoFitPriceScale();
        };
        priceCanvas.addEventListener('mousedown', this._onPriceAxisDown);
        priceCanvas.addEventListener('dblclick', this._onPriceAxisDblClick);

        // Time axis events
        this._onTimeAxisDown = (e) => this._axisDrag.tryStartDrag(e, 'timeAxis');
        timeCanvas.addEventListener('mousedown', this._onTimeAxisDown);

        // Make canvas focusable for keyboard events
        uiCanvas.tabIndex = 0;
        uiCanvas.style.outline = 'none';
    }

    _handleMouseDown(e) {
        // Drawing tool gets priority
        if (this._drawingTool.onMouseDown(e)) return;
        this._panZoom.onMouseDown(e);
    }

    _handleMouseMove(e) {
        if (this._drawingTool.onMouseMove(e)) {
            this._crosshair.onMouseMove(e);
            return;
        }
        if (this._panZoom.onMouseMove(e)) {
            this._crosshair.onMouseMove(e);
            return;
        }
        this._crosshair.onMouseMove(e);
    }

    _handleMouseUp(e) {
        this._drawingTool.onMouseUp(e);
        this._panZoom.onMouseUp(e);
    }

    _handleClick(e) {
        this._drawingTool.onPlacementClick(e);
    }

    _handleDblClick(e) {
        // Double-click on price axis resets auto-scale (handled separately).
        // Double-click on chart with no drawing selected does nothing extra.
        // The DrawingToolbar auto-shows on selection.
    }

    _handleKeyDown(e) {
        this._drawingTool.onKeyDown(e);
    }

    destroy() {
        const uiCanvas = this._chart.layout.uiCanvas;
        const priceCanvas = this._chart.layout.priceAxisCanvas;
        const timeCanvas = this._chart.layout.timeAxisCanvas;

        uiCanvas.removeEventListener('mousedown', this._onMouseDown);
        uiCanvas.removeEventListener('mousemove', this._onMouseMove);
        uiCanvas.removeEventListener('mouseup', this._onMouseUp);
        uiCanvas.removeEventListener('wheel', this._onWheel);
        uiCanvas.removeEventListener('mouseleave', this._onMouseLeave);
        uiCanvas.removeEventListener('click', this._onClick);
        uiCanvas.removeEventListener('dblclick', this._onDblClick);
        document.removeEventListener('keydown', this._onKeyDown);
        document.removeEventListener('mouseup', this._onGlobalMouseUp);
        document.removeEventListener('mousemove', this._onGlobalMouseMove);

        priceCanvas.removeEventListener('mousedown', this._onPriceAxisDown);
        priceCanvas.removeEventListener('dblclick', this._onPriceAxisDblClick);
        timeCanvas.removeEventListener('mousedown', this._onTimeAxisDown);

        this._panZoom.destroy();
        this._axisDrag.destroy();
    }
}
