/**
 * Floating, draggable settings popup for indicators.
 * Dynamically built from the indicator's settingsConfig with tabbed layout.
 *
 * Supported setting types:
 *   number    – numeric input with min/max/step
 *   color     – color swatch button with native picker
 *   select    – dropdown
 *   boolean   – labeled checkbox
 *   lineStyle – visual solid/dashed/dotted selector
 *   slider    – range slider with value readout
 *   string    – text input
 *
 * Settings can declare:
 *   tab   – 'inputs' | 'style'  (defaults to 'inputs')
 *   group – optional section header text
 */
export class IndicatorSettingsDialog {
    constructor(chart) {
        this._chart = chart;
        this._el = null;
        this._currentIndicator = null;
        this._inputs = {};
        this._dragState = null;

        this._onMouseMove = this._onMouseMove.bind(this);
        this._onMouseUp = this._onMouseUp.bind(this);
    }

    get isOpen() {
        return this._el !== null;
    }

    open(indicator) {
        this.close();
        this._currentIndicator = indicator;
        this._snapshotSettings = JSON.parse(JSON.stringify(indicator.settings));
        this._build();
    }

    close() {
        if (this._el) {
            this._el.remove();
            this._el = null;
        }
        this._currentIndicator = null;
        this._inputs = {};
        document.removeEventListener('mousemove', this._onMouseMove);
        document.removeEventListener('mouseup', this._onMouseUp);
    }

    // ── Build ──────────────────────────────────────────────────────

    _build() {
        const ind = this._currentIndicator;
        const config = ind.constructor.settingsConfig;

        // Popup container
        this._el = document.createElement('div');
        this._el.className = 'btc-isd';

        // Title bar (draggable)
        const titleBar = document.createElement('div');
        titleBar.className = 'btc-isd-titlebar';
        titleBar.addEventListener('mousedown', (e) => this._startDrag(e));

        const titleText = document.createElement('span');
        titleText.className = 'btc-isd-title';
        titleText.textContent = ind.constructor.indicatorName;
        titleBar.appendChild(titleText);

        const closeBtn = document.createElement('button');
        closeBtn.className = 'btc-isd-close';
        closeBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
        closeBtn.addEventListener('click', () => this._cancel());
        titleBar.appendChild(closeBtn);
        this._el.appendChild(titleBar);

        // Partition settings into tabs
        const tabs = this._partitionTabs(config);
        const tabKeys = Object.keys(tabs);

        // Tab bar (only show if >1 tab)
        this._tabBodies = {};
        if (tabKeys.length > 1) {
            const tabBar = document.createElement('div');
            tabBar.className = 'btc-isd-tabbar';
            for (const key of tabKeys) {
                const btn = document.createElement('button');
                btn.className = 'btc-isd-tab';
                btn.textContent = this._tabLabel(key);
                btn.dataset.tab = key;
                btn.addEventListener('click', () => this._switchTab(key));
                tabBar.appendChild(btn);
            }
            this._el.appendChild(tabBar);
        }

        // Tab bodies
        const bodyWrap = document.createElement('div');
        bodyWrap.className = 'btc-isd-body';

        for (const key of tabKeys) {
            const body = document.createElement('div');
            body.className = 'btc-isd-tab-body';
            body.dataset.tab = key;

            let lastGroup = null;
            for (const cfg of tabs[key]) {
                if (cfg.group && cfg.group !== lastGroup) {
                    lastGroup = cfg.group;
                    const header = document.createElement('div');
                    header.className = 'btc-isd-group';
                    header.textContent = cfg.group;
                    body.appendChild(header);
                }
                const row = this._buildRow(cfg, ind);
                body.appendChild(row);
            }

            this._tabBodies[key] = body;
            bodyWrap.appendChild(body);
        }
        this._el.appendChild(bodyWrap);

        // Footer actions
        const footer = document.createElement('div');
        footer.className = 'btc-isd-footer';

        const defaultsBtn = document.createElement('button');
        defaultsBtn.className = 'btc-isd-btn btc-isd-defaults';
        defaultsBtn.textContent = 'Defaults';
        defaultsBtn.addEventListener('click', () => this._resetDefaults());
        footer.appendChild(defaultsBtn);

        const spacer = document.createElement('span');
        spacer.style.flex = '1';
        footer.appendChild(spacer);

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'btc-isd-btn btc-isd-cancel';
        cancelBtn.textContent = 'Cancel';
        cancelBtn.addEventListener('click', () => this._cancel());
        footer.appendChild(cancelBtn);

        const okBtn = document.createElement('button');
        okBtn.className = 'btc-isd-btn btc-isd-ok';
        okBtn.textContent = 'Ok';
        okBtn.addEventListener('click', () => this._apply());
        footer.appendChild(okBtn);

        this._el.appendChild(footer);

        // Mount
        this._chart.layout._container.appendChild(this._el);

        // Position near center of chart
        const cw = this._chart.layout.containerWidth;
        const ch = this._chart.layout.containerHeight;
        const pw = this._el.offsetWidth;
        const ph = this._el.offsetHeight;
        this._el.style.left = `${Math.max(40, (cw - pw) / 2)}px`;
        this._el.style.top = `${Math.max(40, (ch - ph) / 2.5)}px`;

        // Activate first tab
        if (tabKeys.length > 0) {
            this._switchTab(tabKeys[0]);
        }
    }

    _partitionTabs(config) {
        const tabs = {};
        for (const cfg of config) {
            const tab = cfg.tab || 'inputs';
            if (!tabs[tab]) tabs[tab] = [];
            tabs[tab].push(cfg);
        }
        return tabs;
    }

    _tabLabel(key) {
        const labels = { inputs: 'Inputs', style: 'Style', visibility: 'Visibility' };
        return labels[key] || key.charAt(0).toUpperCase() + key.slice(1);
    }

    _switchTab(key) {
        for (const [k, body] of Object.entries(this._tabBodies)) {
            body.style.display = k === key ? '' : 'none';
        }
        this._el.querySelectorAll('.btc-isd-tab').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === key);
        });
    }

    // ── Row builders ───────────────────────────────────────────────

    _buildRow(cfg, ind) {
        const row = document.createElement('div');
        row.className = 'btc-isd-row';

        const label = document.createElement('label');
        label.className = 'btc-isd-label';
        label.textContent = cfg.label;
        row.appendChild(label);

        const control = document.createElement('div');
        control.className = 'btc-isd-control';

        let input;
        switch (cfg.type) {
            case 'number':
                input = this._buildNumber(cfg, ind);
                break;
            case 'color':
                input = this._buildColor(cfg, ind);
                break;
            case 'select':
                input = this._buildSelect(cfg, ind);
                break;
            case 'boolean':
                input = this._buildCheckbox(cfg, ind);
                break;
            case 'lineStyle':
                input = this._buildLineStyle(cfg, ind);
                break;
            case 'slider':
                input = this._buildSlider(cfg, ind);
                break;
            case 'timeframe':
                input = this._buildTimeframe(cfg, ind);
                break;
            case 'maLine':
                input = this._buildMaLine(cfg, ind);
                break;
            case 'string':
                input = this._buildString(cfg, ind);
                break;
            default:
                input = this._buildString(cfg, ind);
                break;
        }

        control.appendChild(input.element);
        row.appendChild(control);
        this._inputs[cfg.key] = input;
        return row;
    }

    _buildNumber(cfg, ind) {
        const el = document.createElement('input');
        el.type = 'number';
        el.className = 'btc-isd-input';
        el.value = ind.settings[cfg.key];
        if (cfg.min != null) el.min = cfg.min;
        if (cfg.max != null) el.max = cfg.max;
        if (cfg.step != null) el.step = cfg.step;
        return { element: el, type: 'number', getValue: () => parseFloat(el.value), setValue: (v) => { el.value = v; } };
    }

    _buildColor(cfg, ind) {
        const wrap = document.createElement('div');
        wrap.className = 'btc-isd-color-wrap';

        const swatch = document.createElement('div');
        swatch.className = 'btc-isd-color-swatch';
        swatch.style.backgroundColor = ind.settings[cfg.key] || '#ffffff';
        wrap.appendChild(swatch);

        const picker = document.createElement('input');
        picker.type = 'color';
        picker.className = 'btc-isd-color-native';
        picker.value = ind.settings[cfg.key] || '#ffffff';
        picker.addEventListener('input', () => {
            swatch.style.backgroundColor = picker.value;
        });
        wrap.appendChild(picker);

        swatch.addEventListener('click', () => picker.click());

        return { element: wrap, type: 'color', getValue: () => picker.value, setValue: (v) => { picker.value = v; swatch.style.backgroundColor = v; } };
    }

    _buildSelect(cfg, ind) {
        const el = document.createElement('select');
        el.className = 'btc-isd-select';
        for (const opt of (cfg.options || [])) {
            const o = document.createElement('option');
            o.value = opt;
            o.textContent = this._capitalize(opt);
            if (opt === ind.settings[cfg.key]) o.selected = true;
            el.appendChild(o);
        }
        return { element: el, type: 'select', getValue: () => el.value, setValue: (v) => { el.value = v; } };
    }

    _buildCheckbox(cfg, ind) {
        const wrap = document.createElement('label');
        wrap.className = 'btc-isd-checkbox-wrap';
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.className = 'btc-isd-checkbox';
        cb.checked = !!ind.settings[cfg.key];
        wrap.appendChild(cb);
        return { element: wrap, type: 'boolean', getValue: () => cb.checked, setValue: (v) => { cb.checked = v; } };
    }

    _buildLineStyle(cfg, ind) {
        const wrap = document.createElement('div');
        wrap.className = 'btc-isd-linestyle-wrap';

        const styles = ['solid', 'dashed', 'dotted'];
        let current = ind.settings[cfg.key] || 'solid';

        for (const s of styles) {
            const btn = document.createElement('button');
            btn.className = 'btc-isd-ls-btn';
            if (s === current) btn.classList.add('active');
            btn.title = this._capitalize(s);
            btn.dataset.style = s;

            // Draw preview line
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('width', '28');
            svg.setAttribute('height', '14');
            svg.setAttribute('viewBox', '0 0 28 14');
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', '2');
            line.setAttribute('y1', '7');
            line.setAttribute('x2', '26');
            line.setAttribute('y2', '7');
            line.setAttribute('stroke', 'currentColor');
            line.setAttribute('stroke-width', '2');
            if (s === 'dashed') line.setAttribute('stroke-dasharray', '5,3');
            if (s === 'dotted') line.setAttribute('stroke-dasharray', '2,2');
            svg.appendChild(line);
            btn.appendChild(svg);

            btn.addEventListener('click', () => {
                current = s;
                wrap.querySelectorAll('.btc-isd-ls-btn').forEach(b => b.classList.toggle('active', b.dataset.style === s));
            });
            wrap.appendChild(btn);
        }

        return {
            element: wrap,
            type: 'lineStyle',
            getValue: () => current,
            setValue: (v) => {
                current = v;
                wrap.querySelectorAll('.btc-isd-ls-btn').forEach(b => b.classList.toggle('active', b.dataset.style === v));
            }
        };
    }

    _buildSlider(cfg, ind) {
        const wrap = document.createElement('div');
        wrap.className = 'btc-isd-slider-wrap';

        const range = document.createElement('input');
        range.type = 'range';
        range.className = 'btc-isd-slider';
        range.value = ind.settings[cfg.key];
        if (cfg.min != null) range.min = cfg.min;
        if (cfg.max != null) range.max = cfg.max;
        if (cfg.step != null) range.step = cfg.step;
        wrap.appendChild(range);

        const readout = document.createElement('span');
        readout.className = 'btc-isd-slider-val';
        readout.textContent = range.value;
        wrap.appendChild(readout);

        range.addEventListener('input', () => { readout.textContent = range.value; });

        return { element: wrap, type: 'slider', getValue: () => parseFloat(range.value), setValue: (v) => { range.value = v; readout.textContent = v; } };
    }

    _buildString(cfg, ind) {
        const el = document.createElement('input');
        el.type = 'text';
        el.className = 'btc-isd-input';
        el.value = ind.settings[cfg.key] ?? '';
        return { element: el, type: 'string', getValue: () => el.value, setValue: (v) => { el.value = v; } };
    }

    _buildTimeframe(cfg, ind) {
        const TIMEFRAMES = [
            { value: 'chart', label: 'Chart' },
            { value: '1m', label: '1 minute' },
            { value: '5m', label: '5 minutes' },
            { value: '15m', label: '15 minutes' },
            { value: '30m', label: '30 minutes' },
            { value: '1h', label: '1 hour' },
            { value: '2h', label: '2 hours' },
            { value: '4h', label: '4 hours' },
            { value: '1D', label: '1 day' },
            { value: '1W', label: '1 week' },
        ];
        const el = document.createElement('select');
        el.className = 'btc-isd-select';
        for (const tf of TIMEFRAMES) {
            const o = document.createElement('option');
            o.value = tf.value;
            o.textContent = tf.label;
            if (tf.value === ind.settings[cfg.key]) o.selected = true;
            el.appendChild(o);
        }
        return { element: el, type: 'timeframe', getValue: () => el.value, setValue: (v) => { el.value = v; } };
    }

    _buildMaLine(cfg, ind) {
        const val = ind.settings[cfg.key] || {};
        const wrap = document.createElement('div');
        wrap.className = 'btc-isd-maline';

        // Enabled checkbox
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.className = 'btc-isd-checkbox';
        cb.checked = val.enabled !== false;
        wrap.appendChild(cb);

        // Type dropdown (SMA / EMA)
        const typeSel = document.createElement('select');
        typeSel.className = 'btc-isd-select btc-isd-maline-type';
        for (const t of ['SMA', 'EMA']) {
            const o = document.createElement('option');
            o.value = t;
            o.textContent = t;
            if (t === (val.type || 'SMA')) o.selected = true;
            typeSel.appendChild(o);
        }
        wrap.appendChild(typeSel);

        // Source dropdown
        const srcSel = document.createElement('select');
        srcSel.className = 'btc-isd-select btc-isd-maline-src';
        for (const s of ['close', 'open', 'high', 'low']) {
            const o = document.createElement('option');
            o.value = s;
            o.textContent = this._capitalize(s);
            if (s === (val.source || 'close')) o.selected = true;
            srcSel.appendChild(o);
        }
        wrap.appendChild(srcSel);

        // Period input
        const periodInput = document.createElement('input');
        periodInput.type = 'number';
        periodInput.className = 'btc-isd-input btc-isd-maline-period';
        periodInput.value = val.period ?? 20;
        periodInput.min = 1;
        periodInput.max = 500;
        periodInput.step = 1;
        wrap.appendChild(periodInput);

        // Color swatch
        const colorWrap = document.createElement('div');
        colorWrap.className = 'btc-isd-color-wrap';
        const swatch = document.createElement('div');
        swatch.className = 'btc-isd-color-swatch';
        swatch.style.backgroundColor = val.color || '#ffffff';
        colorWrap.appendChild(swatch);
        const picker = document.createElement('input');
        picker.type = 'color';
        picker.className = 'btc-isd-color-native';
        picker.value = val.color || '#ffffff';
        picker.addEventListener('input', () => { swatch.style.backgroundColor = picker.value; });
        colorWrap.appendChild(picker);
        swatch.addEventListener('click', () => picker.click());
        wrap.appendChild(colorWrap);

        return {
            element: wrap,
            type: 'maLine',
            getValue: () => ({
                enabled: cb.checked,
                type: typeSel.value,
                source: srcSel.value,
                period: parseInt(periodInput.value, 10),
                color: picker.value,
            }),
            setValue: (v) => {
                cb.checked = v.enabled !== false;
                typeSel.value = v.type || 'SMA';
                srcSel.value = v.source || 'close';
                periodInput.value = v.period ?? 20;
                picker.value = v.color || '#ffffff';
                swatch.style.backgroundColor = v.color || '#ffffff';
            }
        };
    }

    _capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    // ── Actions ────────────────────────────────────────────────────

    _apply() {
        const newSettings = {};
        for (const [key, entry] of Object.entries(this._inputs)) {
            newSettings[key] = entry.getValue();
        }
        this._chart.indicatorManager.updateSettings(this._currentIndicator.id, newSettings);
        this.close();
    }

    _cancel() {
        if (this._currentIndicator && this._snapshotSettings) {
            this._chart.indicatorManager.updateSettings(this._currentIndicator.id, this._snapshotSettings);
        }
        this.close();
    }

    _resetDefaults() {
        const defaults = this._currentIndicator.constructor.defaultSettings();
        // Preserve auto-assigned colors that default to null
        if (defaults.color === null && this._snapshotSettings.color) {
            defaults.color = this._snapshotSettings.color;
        }
        // For maLine entries, preserve the original auto-assigned color if the default color is present
        for (const [key, entry] of Object.entries(this._inputs)) {
            if (key in defaults) {
                if (entry.type === 'maLine' && defaults[key] && this._snapshotSettings[key]) {
                    defaults[key] = { ...defaults[key], color: this._snapshotSettings[key].color };
                }
                entry.setValue(defaults[key]);
            }
        }
    }

    // ── Drag ───────────────────────────────────────────────────────

    _startDrag(e) {
        if (e.target.closest('.btc-isd-close')) return;
        const rect = this._el.getBoundingClientRect();
        const containerRect = this._chart.layout._container.getBoundingClientRect();
        this._dragState = {
            offsetX: e.clientX - rect.left,
            offsetY: e.clientY - rect.top,
            containerLeft: containerRect.left,
            containerTop: containerRect.top,
        };
        document.addEventListener('mousemove', this._onMouseMove);
        document.addEventListener('mouseup', this._onMouseUp);
        e.preventDefault();
    }

    _onMouseMove(e) {
        if (!this._dragState || !this._el) return;
        const x = e.clientX - this._dragState.containerLeft - this._dragState.offsetX;
        const y = e.clientY - this._dragState.containerTop - this._dragState.offsetY;
        this._el.style.left = `${Math.max(0, x)}px`;
        this._el.style.top = `${Math.max(0, y)}px`;
    }

    _onMouseUp() {
        this._dragState = null;
        document.removeEventListener('mousemove', this._onMouseMove);
        document.removeEventListener('mouseup', this._onMouseUp);
    }
}
