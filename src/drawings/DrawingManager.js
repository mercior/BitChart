import { EventEmitter } from '../core/EventEmitter.js';
import { DRAWING_TOOLS } from '../constants.js';

export class DrawingManager extends EventEmitter {
    drawings = [];
    activeTool = DRAWING_TOOLS.POINTER;
    selectedDrawings = [];
    drawingsVisible = true;

    get selectedDrawing() {
        return this.selectedDrawings.length === 1 ? this.selectedDrawings[0] : null;
    }

    addDrawing(drawing) {
        this.drawings.push(drawing);
        this.emit('drawingsChanged');
    }

    removeDrawing(id) {
        const idx = this.drawings.findIndex(d => d.id === id);
        if (idx !== -1) {
            const removed = this.drawings[idx];
            removed.isSelected = false;
            this.selectedDrawings = this.selectedDrawings.filter(d => d.id !== id);
            this.drawings.splice(idx, 1);
            this.emit('drawingsChanged');
            this.emit('selectionChanged');
        }
    }

    removeSelected() {
        const ids = this.selectedDrawings.map(d => d.id);
        for (const id of ids) {
            const idx = this.drawings.findIndex(d => d.id === id);
            if (idx !== -1) {
                this.drawings[idx].isSelected = false;
                this.drawings.splice(idx, 1);
            }
        }
        this.selectedDrawings = [];
        this.emit('drawingsChanged');
        this.emit('selectionChanged');
    }

    selectDrawing(drawing, addToSelection = false) {
        if (addToSelection) {
            if (drawing.isSelected) {
                drawing.isSelected = false;
                this.selectedDrawings = this.selectedDrawings.filter(d => d.id !== drawing.id);
            } else {
                drawing.isSelected = true;
                this.selectedDrawings.push(drawing);
            }
        } else {
            for (const d of this.selectedDrawings) {
                d.isSelected = false;
            }
            this.selectedDrawings = [drawing];
            drawing.isSelected = true;
        }
        this.emit('drawingsChanged');
        this.emit('selectionChanged');
    }

    deselectAll() {
        if (this.selectedDrawings.length === 0) return;
        for (const d of this.selectedDrawings) {
            d.isSelected = false;
        }
        this.selectedDrawings = [];
        this.emit('drawingsChanged');
        this.emit('selectionChanged');
    }

    setActiveTool(tool) {
        this.activeTool = tool;
        if (tool !== DRAWING_TOOLS.POINTER) {
            this.deselectAll();
        }
        this.emit('toolChanged', tool);
    }

    clearAll() {
        this.drawings = [];
        this.selectedDrawings = [];
        this.emit('drawingsChanged');
        this.emit('selectionChanged');
    }

    toggleVisibility() {
        this.drawingsVisible = !this.drawingsVisible;
        this.emit('drawingsChanged');
        return this.drawingsVisible;
    }

    getSelectedType() {
        if (this.selectedDrawings.length === 0) return null;
        const type = this.selectedDrawings[0].type;
        if (this.selectedDrawings.every(d => d.type === type)) return type;
        return 'mixed';
    }
}
