const FONT_OPTIONS = [
    'Trebuchet MS', 'Arial', 'Helvetica', 'Georgia', 'Courier New', 'Verdana', 'monospace'
];

const COLOR_SWATCHES = [
    '#000000', '#1a1a1a', '#333333', '#4d4d4d', '#666666', '#808080', '#999999', '#b3b3b3', '#cccccc', '#ffffff',
    '#ef5350', '#e53935', '#c62828', '#b71c1c', '#d32f2f', '#f44336', '#ff5252', '#ff8a80', '#ff1744', '#d50000',
    '#ff9800', '#fb8c00', '#f57c00', '#ef6c00', '#e65100', '#ffa726', '#ffb74d', '#ffcc80', '#ffe0b2', '#fff3e0',
    '#ffeb3b', '#fdd835', '#fbc02d', '#f9a825', '#f57f17', '#ffee58', '#fff176', '#fff59d', '#fff9c4', '#fffde7',
    '#8bc34a', '#7cb342', '#689f38', '#558b2f', '#33691e', '#9ccc65', '#aed581', '#c5e1a5', '#dcedc8', '#f1f8e9',
    '#26a69a', '#00897b', '#00796b', '#00695c', '#004d40', '#4db6ac', '#80cbc4', '#b2dfdb', '#e0f2f1', '#e8f5e9',
    '#42a5f5', '#1e88e5', '#1976d2', '#1565c0', '#0d47a1', '#2196f3', '#64b5f6', '#90caf9', '#bbdefb', '#e3f2fd',
    '#2962ff', '#2979ff', '#448aff', '#536dfe', '#3d5afe', '#304ffe', '#6200ea', '#651fff', '#7c4dff', '#b388ff',
    '#ab47bc', '#9c27b0', '#8e24aa', '#7b1fa2', '#6a1b9a', '#ce93d8', '#e1bee7', '#f3e5f5', '#f8bbd0', '#fce4ec',
    '#ec407a', '#e91e63', '#d81b60', '#c2185b', '#ad1457', '#f48fb1', '#f06292', '#ff4081', '#ff80ab', '#ff1744',
];

const SHAPE_TYPES = new Set(['rectangle', 'triangle', 'circle', 'polygon']);
const POSITION_TYPES = new Set(['longPosition', 'shortPosition']);

export class DrawingToolbar {
    constructor(chart) {
        this._chart = chart;
        this._el = null;
        this._isDragging = false;
        this._dragOffsetX = 0;
        this._dragOffsetY = 0;
        this._colorPopupEl = null;
        this._isRendering = false;
        this._build();

        this._chart.drawingManager.on('selectionChanged', () => this._onSelectionChanged());
    }

    _build() {
        this._el = document.createElement('div');
        this._el.className = 'btc-drawing-toolbar';
        this._el.style.display = 'none';
        this._chart.layout._container.appendChild(this._el);

        this._onMouseDown = (e) => this._startDrag(e);
        this._onMouseMove = (e) => this._onDrag(e);
        this._onMouseUp = () => this._endDrag();
    }

    _startDrag(e) {
        if (e.target.closest('.btc-dtb-control')) return;
        this._isDragging = true;
        const rect = this._el.getBoundingClientRect();
        this._dragOffsetX = e.clientX - rect.left;
        this._dragOffsetY = e.clientY - rect.top;
        document.addEventListener('mousemove', this._onMouseMove);
        document.addEventListener('mouseup', this._onMouseUp);
        e.preventDefault();
    }

    _onDrag(e) {
        if (!this._isDragging) return;
        const containerRect = this._chart.layout._container.getBoundingClientRect();
        let x = e.clientX - containerRect.left - this._dragOffsetX;
        let y = e.clientY - containerRect.top - this._dragOffsetY;
        x = Math.max(0, Math.min(x, containerRect.width - this._el.offsetWidth));
        y = Math.max(0, Math.min(y, containerRect.height - this._el.offsetHeight));
        this._el.style.left = `${x}px`;
        this._el.style.top = `${y}px`;
        this._el.style.right = 'auto';
    }

    _endDrag() {
        this._isDragging = false;
        document.removeEventListener('mousemove', this._onMouseMove);
        document.removeEventListener('mouseup', this._onMouseUp);
    }

    _onSelectionChanged() {
        const dm = this._chart.drawingManager;
        if (dm.selectedDrawings.length === 0) {
            this._el.style.display = 'none';
            this._hideColorPopup();
            return;
        }
        this._el.style.display = 'flex';
        this._renderControls();
    }

    _renderControls() {
        const dm = this._chart.drawingManager;
        const selections = dm.selectedDrawings;
        if (selections.length === 0) return;

        this._isRendering = true;
        this._hideColorPopup();

        const selType = dm.getSelectedType();
        const first = selections[0];
        const isLine = selType === 'line' || selType === 'extendedLine' || selType === 'horizontalLine';
        const isText = selType === 'text';
        const isShape = SHAPE_TYPES.has(selType);
        const isPosition = POSITION_TYPES.has(selType);
        const allLocked = selections.every(d => d.isLocked);

        this._el.innerHTML = '';

        const handle = this._mkEl('div', 'btc-dtb-drag-handle');
        handle.title = 'Drag to move';
        handle.textContent = '⋮⋮';
        handle.addEventListener('mousedown', this._onMouseDown);
        this._el.appendChild(handle);

        if (isLine || isText || selType === 'mixed') {
            this._addColorControl(selections, first, 'color', 'opacity', 'Color & Opacity');
        }

        if (isShape) {
            this._addColorControl(selections, first, 'color', 'borderOpacity', 'Border Color');
            this._el.appendChild(this._mkSep());
            this._addFillColorControl(selections, first);
        }

        if (isLine || isShape || selType === 'mixed') {
            this._el.appendChild(this._mkSep());

            const styleSel = this._mkSelect('btc-dtb-control btc-dtb-line-style', [
                { v: 'solid', t: '—' }, { v: 'dashed', t: '- -' }, { v: 'dotted', t: '···' }
            ], first.style.lineStyle);
            styleSel.title = 'Line Style';
            styleSel.addEventListener('change', (e) => {
                for (const d of selections) d.style.lineStyle = e.target.value;
                this._emitChanged();
            });
            this._el.appendChild(styleSel);

            this._el.appendChild(this._mkSep());

            const widthSel = this._mkSelect('btc-dtb-control btc-dtb-line-width',
                [1, 2, 3, 4, 5].map(n => ({ v: String(n), t: `${n}px` })),
                String(first.style.lineWidth));
            widthSel.title = 'Line Width';
            widthSel.addEventListener('change', (e) => {
                for (const d of selections) d.style.lineWidth = parseInt(e.target.value);
                this._emitChanged();
            });
            this._el.appendChild(widthSel);
        }

        if (isPosition) {
            this._addPositionControls(selections, first);
        }

        if (isText) {
            this._el.appendChild(this._mkSep());

            const editBtn = this._mkEl('button', 'btc-dtb-control btc-dtb-btn');
            editBtn.title = 'Edit Text';
            editBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>';
            editBtn.addEventListener('click', () => {
                if (selections.length === 1 && this._chart.textInputDialog) {
                    const d = selections[0];
                    this._chart.textInputDialog.show(d.text, 'Edit Text').then((newText) => {
                        if (newText !== null && newText !== '') {
                            d.text = newText;
                            this._emitChanged();
                        }
                    });
                }
            });
            this._el.appendChild(editBtn);

            this._el.appendChild(this._mkSep());

            const fontSel = this._mkSelect('btc-dtb-control btc-dtb-font',
                FONT_OPTIONS.map(f => ({ v: f, t: f })), first.fontFamily);
            fontSel.title = 'Font';
            fontSel.addEventListener('change', (e) => {
                for (const d of selections) d.fontFamily = e.target.value;
                this._emitChanged();
            });
            this._el.appendChild(fontSel);

            this._el.appendChild(this._mkSep());

            const sizeSel = this._mkSelect('btc-dtb-control btc-dtb-font-size',
                [10, 12, 14, 16, 18, 20, 24, 28, 32].map(s => ({ v: String(s), t: `${s}px` })),
                String(first.style.fontSize));
            sizeSel.title = 'Font Size';
            sizeSel.addEventListener('change', (e) => {
                for (const d of selections) d.style.fontSize = parseInt(e.target.value);
                this._emitChanged();
            });
            this._el.appendChild(sizeSel);
        }

        this._el.appendChild(this._mkSep());

        const lockBtn = this._mkEl('button', `btc-dtb-control btc-dtb-btn btc-dtb-lock ${allLocked ? 'active' : ''}`);
        lockBtn.title = allLocked ? 'Unlock' : 'Lock';
        lockBtn.innerHTML = allLocked
            ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>'
            : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>';
        lockBtn.addEventListener('click', () => {
            const newState = !selections.every(d => d.isLocked);
            for (const d of selections) d.isLocked = newState;
            this._renderControls();
            this._emitChanged();
        });
        this._el.appendChild(lockBtn);

        const delBtn = this._mkEl('button', 'btc-dtb-control btc-dtb-btn btc-dtb-delete');
        delBtn.title = 'Delete';
        delBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>';
        delBtn.addEventListener('click', () => dm.removeSelected());
        this._el.appendChild(delBtn);

        this._isRendering = false;
    }

    _addColorControl(selections, first, colorProp, opacityProp, title) {
        const colorBtn = this._mkEl('div', 'btc-dtb-control btc-dtb-color-btn');
        colorBtn.title = title;
        const preview = this._mkEl('div', 'btc-dtb-color-preview');
        preview.style.background = first.style[colorProp];
        preview.style.opacity = first.style[opacityProp];
        colorBtn.appendChild(preview);
        colorBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this._toggleColorPopup(selections, preview, colorProp, opacityProp);
        });
        this._el.appendChild(colorBtn);
    }

    _addFillColorControl(selections, first) {
        const fillBtn = this._mkEl('div', 'btc-dtb-control btc-dtb-color-btn');
        fillBtn.title = 'Fill Color & Opacity';
        const preview = this._mkEl('div', 'btc-dtb-color-preview btc-dtb-fill-preview');
        preview.style.background = first.style.fillColor || 'transparent';
        preview.style.opacity = first.style.fillOpacity;
        fillBtn.appendChild(preview);
        fillBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this._toggleColorPopup(selections, preview, 'fillColor', 'fillOpacity');
        });
        this._el.appendChild(fillBtn);
    }

    _addPositionControls(selections, first) {
        this._el.appendChild(this._mkSep());

        const qtyLabel = this._mkEl('span', 'btc-dtb-label');
        qtyLabel.textContent = 'Qty:';
        this._el.appendChild(qtyLabel);

        const qtyInput = document.createElement('input');
        qtyInput.type = 'number';
        qtyInput.className = 'btc-dtb-control btc-dtb-input';
        qtyInput.step = '0.001';
        qtyInput.min = '0';
        qtyInput.value = String(first.qty || 0.1);
        qtyInput.addEventListener('change', () => {
            const val = parseFloat(qtyInput.value) || 0.1;
            for (const d of selections) d.qty = val;
            this._emitChanged();
        });
        this._el.appendChild(qtyInput);

        this._el.appendChild(this._mkSep());

        const acctLabel = this._mkEl('span', 'btc-dtb-label');
        acctLabel.textContent = 'Acct:';
        this._el.appendChild(acctLabel);

        const acctInput = document.createElement('input');
        acctInput.type = 'number';
        acctInput.className = 'btc-dtb-control btc-dtb-input';
        acctInput.step = '100';
        acctInput.min = '0';
        acctInput.value = String(first.accountSize || 10000);
        acctInput.addEventListener('change', () => {
            const val = parseFloat(acctInput.value) || 10000;
            for (const d of selections) d.accountSize = val;
            this._emitChanged();
        });
        this._el.appendChild(acctInput);
    }

    // -- Color popup with swatches + opacity --

    _toggleColorPopup(selections, previewEl, colorProp, opacityProp) {
        if (this._colorPopupEl) {
            this._hideColorPopup();
            return;
        }
        this._showColorPopup(selections, previewEl, colorProp, opacityProp);
    }

    _showColorPopup(selections, previewEl, colorProp, opacityProp) {
        this._hideColorPopup();
        const first = selections[0];
        const popup = document.createElement('div');
        popup.className = 'btc-color-popup';

        const grid = document.createElement('div');
        grid.className = 'btc-color-grid';
        for (const color of COLOR_SWATCHES) {
            const swatch = document.createElement('div');
            swatch.className = 'btc-color-swatch';
            if (color === first.style[colorProp]) swatch.classList.add('selected');
            swatch.style.background = color;
            swatch.dataset.color = color;
            swatch.addEventListener('click', () => {
                for (const d of selections) d.style[colorProp] = color;
                previewEl.style.background = color;
                popup.querySelectorAll('.btc-color-swatch').forEach(s => s.classList.remove('selected'));
                swatch.classList.add('selected');
                this._emitChanged();
            });
            grid.appendChild(swatch);
        }
        popup.appendChild(grid);

        const customRow = document.createElement('div');
        customRow.className = 'btc-color-custom-row';
        const plusBtn = document.createElement('div');
        plusBtn.className = 'btc-color-custom-plus';
        plusBtn.textContent = '+';
        plusBtn.title = 'Custom color';
        const hiddenInput = document.createElement('input');
        hiddenInput.type = 'color';
        hiddenInput.className = 'btc-color-custom-input';
        hiddenInput.value = first.style[colorProp] || '#ffffff';
        hiddenInput.addEventListener('input', (e) => {
            for (const d of selections) d.style[colorProp] = e.target.value;
            previewEl.style.background = e.target.value;
            this._emitChanged();
        });
        plusBtn.addEventListener('click', () => hiddenInput.click());
        customRow.appendChild(plusBtn);
        popup.appendChild(customRow);

        const opLabel = document.createElement('div');
        opLabel.className = 'btc-color-opacity-label';
        opLabel.textContent = 'Opacity';
        popup.appendChild(opLabel);

        const opRow = document.createElement('div');
        opRow.className = 'btc-color-opacity-row';

        const opSlider = document.createElement('input');
        opSlider.type = 'range';
        opSlider.className = 'btc-color-opacity-slider';
        opSlider.min = '0';
        opSlider.max = '100';
        opSlider.step = '1';
        opSlider.value = String(Math.round((first.style[opacityProp] ?? 1) * 100));

        const opVal = document.createElement('div');
        opVal.className = 'btc-color-opacity-val';
        opVal.textContent = `${Math.round((first.style[opacityProp] ?? 1) * 100)}%`;

        opSlider.addEventListener('input', () => {
            const pct = parseInt(opSlider.value);
            const val = pct / 100;
            for (const d of selections) d.style[opacityProp] = val;
            previewEl.style.opacity = val;
            opVal.textContent = `${pct}%`;
            this._emitChanged();
        });

        opRow.appendChild(opSlider);
        opRow.appendChild(opVal);
        popup.appendChild(opRow);

        const btnRect = previewEl.parentElement.getBoundingClientRect();
        const containerRect = this._chart.layout._container.getBoundingClientRect();
        popup.style.left = `${btnRect.left - containerRect.left}px`;
        popup.style.top = `${btnRect.bottom - containerRect.top + 4}px`;

        this._chart.layout._container.appendChild(popup);
        this._colorPopupEl = popup;

        this._colorPopupClose = (e) => {
            if (!popup.contains(e.target) && !previewEl.parentElement.contains(e.target)) {
                this._hideColorPopup();
            }
        };
        setTimeout(() => document.addEventListener('mousedown', this._colorPopupClose), 0);
    }

    _hideColorPopup() {
        if (this._colorPopupEl) {
            this._colorPopupEl.remove();
            this._colorPopupEl = null;
        }
        if (this._colorPopupClose) {
            document.removeEventListener('mousedown', this._colorPopupClose);
            this._colorPopupClose = null;
        }
    }

    // -- Helpers --

    _emitChanged() {
        this._chart.drawingManager.emit('drawingsChanged');
    }

    _mkEl(tag, className) {
        const el = document.createElement(tag);
        el.className = className;
        return el;
    }

    _mkSep() {
        return this._mkEl('div', 'btc-dtb-sep');
    }

    _mkSelect(className, options, currentValue) {
        const sel = document.createElement('select');
        sel.className = className;
        for (const opt of options) {
            const o = document.createElement('option');
            o.value = opt.v;
            o.textContent = opt.t;
            if (opt.v === currentValue) o.selected = true;
            sel.appendChild(o);
        }
        return sel;
    }
}
