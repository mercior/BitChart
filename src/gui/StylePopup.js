import { COLORS, LINE_STYLES } from '../constants.js';

export class StylePopup {
    constructor(chart) {
        this._chart = chart;
        this._drawing = null;
        this._el = null;
        this._build();
    }

    _build() {
        this._el = document.createElement('div');
        this._el.className = 'btc-style-popup';
        this._el.style.display = 'none';
        this._chart.layout._container.appendChild(this._el);
    }

    show(drawing) {
        this._drawing = drawing;
        this._el.style.display = 'block';

        const handles = drawing.getAnchorHandles(this._chart.timeScale, this._chart.priceScale);
        if (handles.length > 0) {
            const px = handles[0].x + 50;
            const py = handles[0].y - 10;
            this._el.style.left = `${Math.min(px, this._chart.layout.chartWidth - 220)}px`;
            this._el.style.top = `${Math.max(10, py)}px`;
        }

        this._render();
    }

    hide() {
        this._el.style.display = 'none';
        this._drawing = null;
    }

    _render() {
        if (!this._drawing) return;
        const d = this._drawing;

        this._el.innerHTML = `
            <div class="btc-popup-row">
                <label>Color</label>
                <input type="color" class="btc-popup-color" value="${d.style.color}" data-field="color">
            </div>
            <div class="btc-popup-row">
                <label>Width</label>
                <input type="range" min="1" max="5" value="${d.style.lineWidth}" data-field="lineWidth" class="btc-popup-range">
                <span class="btc-popup-val">${d.style.lineWidth}</span>
            </div>
            <div class="btc-popup-row">
                <label>Style</label>
                <select data-field="lineStyle" class="btc-popup-select">
                    <option value="solid" ${d.style.lineStyle === 'solid' ? 'selected' : ''}>Solid</option>
                    <option value="dashed" ${d.style.lineStyle === 'dashed' ? 'selected' : ''}>Dashed</option>
                    <option value="dotted" ${d.style.lineStyle === 'dotted' ? 'selected' : ''}>Dotted</option>
                </select>
            </div>
            <div class="btc-popup-row">
                <label>Opacity</label>
                <input type="range" min="0.1" max="1" step="0.1" value="${d.style.opacity}" data-field="opacity" class="btc-popup-range">
                <span class="btc-popup-val">${d.style.opacity}</span>
            </div>
            <div class="btc-popup-row">
                <label>Fill</label>
                <input type="checkbox" class="btc-popup-fill-toggle" ${d.style.fillColor ? 'checked' : ''}>
                <input type="color" class="btc-popup-color btc-popup-fill-color" value="${d.style.fillColor || '#2962ff'}" ${d.style.fillColor ? '' : 'disabled'}>
            </div>
            <div class="btc-popup-actions">
                <button class="btc-popup-btn btc-popup-delete">Delete</button>
                <button class="btc-popup-btn btc-popup-close">Close</button>
            </div>
        `;

        // Bind events
        this._el.querySelectorAll('[data-field]').forEach(input => {
            input.addEventListener('input', (e) => {
                const field = e.target.dataset.field;
                let value = e.target.value;
                if (field === 'lineWidth') value = parseInt(value);
                if (field === 'opacity') value = parseFloat(value);
                d.style[field] = value;

                const valSpan = e.target.parentElement.querySelector('.btc-popup-val');
                if (valSpan) valSpan.textContent = value;

                this._chart.drawingManager.emit('drawingsChanged');
            });
        });

        const fillToggle = this._el.querySelector('.btc-popup-fill-toggle');
        const fillColor = this._el.querySelector('.btc-popup-fill-color');
        if (fillToggle && fillColor) {
            fillToggle.addEventListener('change', () => {
                fillColor.disabled = !fillToggle.checked;
                d.style.fillColor = fillToggle.checked ? fillColor.value : null;
                this._chart.drawingManager.emit('drawingsChanged');
            });
            fillColor.addEventListener('input', () => {
                d.style.fillColor = fillColor.value;
                this._chart.drawingManager.emit('drawingsChanged');
            });
        }

        this._el.querySelector('.btc-popup-delete')?.addEventListener('click', () => {
            this._chart.drawingManager.removeDrawing(d.id);
            this.hide();
        });

        this._el.querySelector('.btc-popup-close')?.addEventListener('click', () => {
            this.hide();
        });
    }
}
