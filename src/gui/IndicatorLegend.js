/**
 * Indicator legend overlay in the top-left of the chart area.
 * Shows each active indicator with visibility toggle, settings button, and delete button.
 */
export class IndicatorLegend {
    constructor(chart) {
        this._chart = chart;
        this._el = null;
        this._build();
        this._bindEvents();
    }

    _build() {
        this._el = document.createElement('div');
        this._el.className = 'btc-indicator-legend';
        this._chart.layout._chartArea.appendChild(this._el);
    }

    _bindEvents() {
        this._chart.indicatorManager.on('indicatorsChanged', () => this.update());
    }

    update() {
        this._el.innerHTML = '';
        const indicators = this._chart.indicatorManager.indicators;

        for (const ind of indicators) {
            const row = document.createElement('div');
            row.className = 'btc-il-row';
            if (!ind.visible) row.classList.add('btc-il-hidden');

            // Color dot — use first enabled maLine color if no top-level color
            const dot = document.createElement('span');
            dot.className = 'btc-il-dot';
            let dotColor = ind.settings.color;
            if (!dotColor) {
                for (let k = 1; k <= 8; k++) {
                    const ma = ind.settings[`ma${k}`];
                    if (ma && ma.enabled && ma.color) { dotColor = ma.color; break; }
                }
            }
            dot.style.backgroundColor = dotColor || '#888';
            row.appendChild(dot);

            // Name label
            const name = document.createElement('span');
            name.className = 'btc-il-name';
            name.textContent = ind.getLegendText();
            row.appendChild(name);

            // Spacer
            const spacer = document.createElement('span');
            spacer.style.flex = '1';
            row.appendChild(spacer);

            // Visibility toggle
            const visBtn = document.createElement('button');
            visBtn.className = 'btc-il-btn';
            visBtn.title = ind.visible ? 'Hide' : 'Show';
            visBtn.innerHTML = ind.visible ? this._eyeOpenSVG() : this._eyeClosedSVG();
            visBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this._chart.indicatorManager.toggleVisibility(ind.id);
            });
            row.appendChild(visBtn);

            // Settings button
            const settingsBtn = document.createElement('button');
            settingsBtn.className = 'btc-il-btn';
            settingsBtn.title = 'Settings';
            settingsBtn.innerHTML = this._gearSVG();
            settingsBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this._chart.indicatorSettingsDialog.open(ind);
            });
            row.appendChild(settingsBtn);

            // Delete button
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btc-il-btn btc-il-delete';
            deleteBtn.title = 'Remove';
            deleteBtn.innerHTML = this._closeSVG();
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this._chart.indicatorManager.removeIndicator(ind.id);
            });
            row.appendChild(deleteBtn);

            this._el.appendChild(row);
        }
    }

    _eyeOpenSVG() {
        return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
    }

    _eyeClosedSVG() {
        return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;
    }

    _gearSVG() {
        return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>`;
    }

    _closeSVG() {
        return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
    }
}
