export class SettingsPanel {
    constructor(chart) {
        this._chart = chart;
        this._visible = false;
        this._buildButton();
        this._buildPanel();
    }

    _buildButton() {
        this._btn = document.createElement('button');
        this._btn.className = 'btc-settings-btn';
        this._btn.title = 'Settings';
        this._btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
        </svg>`;
        this._btn.addEventListener('click', () => this._toggle());
        this._chart.layout._container.appendChild(this._btn);
    }

    _buildPanel() {
        this._panel = document.createElement('div');
        this._panel.className = 'btc-settings-panel';
        this._panel.style.display = 'none';
        this._chart.layout._container.appendChild(this._panel);
        this._render();
    }

    _toggle() {
        this._visible = !this._visible;
        this._panel.style.display = this._visible ? 'block' : 'none';
        if (this._visible) this._render();
    }

    _render() {
        const isLog = this._chart.priceScale.isLogScale;
        this._panel.innerHTML = `
            <div class="btc-settings-row">
                <label class="btc-settings-label">
                    <input type="checkbox" class="btc-settings-check" ${isLog ? 'checked' : ''}>
                    Logarithmic Scale
                </label>
            </div>
            <div class="btc-settings-row">
                <label class="btc-settings-label">
                    <input type="checkbox" class="btc-settings-autofit" ${this._chart.priceScale.isAutoScale ? 'checked' : ''}>
                    Auto-fit Price
                </label>
            </div>
        `;

        this._panel.querySelector('.btc-settings-check').addEventListener('change', (e) => {
            this._chart.priceScale.setLogScale(e.target.checked);
            if (this._chart.priceScale.isAutoScale) {
                this._chart._autoFitPriceScale();
            }
        });

        this._panel.querySelector('.btc-settings-autofit').addEventListener('change', (e) => {
            if (e.target.checked) {
                this._chart.priceScale.resetAutoScale();
                this._chart._autoFitPriceScale();
            } else {
                this._chart.priceScale._isAutoScale = false;
            }
        });
    }
}
