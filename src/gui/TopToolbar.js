import { IndicatorRegistry } from '../indicators/IndicatorRegistry.js';

const INTERVAL_GROUPS = [
    {
        label: 'TICKS',
        items: [
            { label: '1 tick', value: '1t' },
            { label: '10 ticks', value: '10t' },
            { label: '100 ticks', value: '100t' },
            { label: '1000 ticks', value: '1000t' },
        ],
    },
    {
        label: 'SECONDS',
        items: [
            { label: '1 second', value: '1s' },
            { label: '5 seconds', value: '5s' },
            { label: '10 seconds', value: '10s' },
            { label: '15 seconds', value: '15s' },
            { label: '30 seconds', value: '30s' },
            { label: '45 seconds', value: '45s' },
        ],
    },
    {
        label: 'MINUTES',
        items: [
            { label: '1 minute', value: '1m' },
            { label: '2 minutes', value: '2m' },
            { label: '3 minutes', value: '3m' },
            { label: '5 minutes', value: '5m' },
            { label: '10 minutes', value: '10m' },
            { label: '15 minutes', value: '15m' },
            { label: '30 minutes', value: '30m' },
            { label: '45 minutes', value: '45m' },
        ],
    },
    {
        label: 'HOURS',
        items: [
            { label: '1 hour', value: '1h' },
            { label: '2 hours', value: '2h' },
            { label: '3 hours', value: '3h' },
            { label: '4 hours', value: '4h' },
        ],
    },
    {
        label: 'DAYS',
        items: [
            { label: '1 day', value: '1D' },
            { label: '3 days', value: '3D' },
        ],
    },
    {
        label: 'WEEKS',
        items: [
            { label: '1 week', value: '1W' },
        ],
    },
    {
        label: 'MONTHS',
        items: [
            { label: '1 month', value: '1M' },
        ],
    },
];

const QUICK_INTERVALS = [
    { label: '1m', value: '1m' },
    { label: '3m', value: '3m' },
    { label: '5m', value: '5m' },
    { label: '15m', value: '15m' },
    { label: '1h', value: '1h' },
    { label: '4h', value: '4h' },
    { label: '1D', value: '1D' },
    { label: '1W', value: '1W' },
];

export class TopToolbar {
    constructor(chart) {
        this._chart = chart;
        this._currentInterval = '3m';
        this._dropdownVisible = false;
        this._indicatorDropdownVisible = false;
        this._build();
    }

    get currentInterval() { return this._currentInterval; }

    _build() {
        const el = this._chart.layout.topToolbarElement;
        el.innerHTML = '';

        // Dropdown trigger button
        this._triggerBtn = document.createElement('button');
        this._triggerBtn.className = 'btc-tt-interval-btn btc-tt-trigger';
        this._triggerBtn.innerHTML = `<span class="btc-tt-interval-label">${this._currentInterval}</span><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>`;
        this._triggerBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this._toggleDropdown();
        });
        el.appendChild(this._triggerBtn);

        // Separator
        const sep1 = document.createElement('div');
        sep1.className = 'btc-tt-sep';
        el.appendChild(sep1);

        // Quick-access interval buttons
        for (const qi of QUICK_INTERVALS) {
            const btn = document.createElement('button');
            btn.className = 'btc-tt-interval-btn';
            if (qi.value === this._currentInterval) btn.classList.add('active');
            btn.textContent = qi.label;
            btn.addEventListener('click', () => this._selectInterval(qi.value, qi.label));
            el.appendChild(btn);
        }

        // Separator before indicators
        const sep2 = document.createElement('div');
        sep2.className = 'btc-tt-sep';
        el.appendChild(sep2);

        // Indicators button
        this._indicatorBtn = document.createElement('button');
        this._indicatorBtn.className = 'btc-tt-interval-btn btc-tt-indicator-btn';
        this._indicatorBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg><span>Indicators</span>`;
        this._indicatorBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this._toggleIndicatorDropdown();
        });
        el.appendChild(this._indicatorBtn);

        // Build dropdowns (hidden by default)
        this._buildDropdown();
        this._buildIndicatorDropdown();
    }

    _buildDropdown() {
        this._dropdown = document.createElement('div');
        this._dropdown.className = 'btc-tt-dropdown';
        this._dropdown.style.display = 'none';

        for (const group of INTERVAL_GROUPS) {
            const header = document.createElement('div');
            header.className = 'btc-tt-dropdown-header';
            header.textContent = group.label;
            this._dropdown.appendChild(header);

            for (const item of group.items) {
                const row = document.createElement('div');
                row.className = 'btc-tt-dropdown-item';
                if (item.value === this._currentInterval) row.classList.add('active');
                row.textContent = item.label;
                row.addEventListener('click', () => {
                    this._selectInterval(item.value, item.label);
                    this._hideDropdown();
                });
                this._dropdown.appendChild(row);
            }
        }

        this._chart.layout._container.appendChild(this._dropdown);

        this._closeHandler = (e) => {
            if (!this._dropdown.contains(e.target) && !this._triggerBtn.contains(e.target)) {
                this._hideDropdown();
            }
        };
    }

    _toggleDropdown() {
        if (this._dropdownVisible) {
            this._hideDropdown();
        } else {
            this._showDropdown();
        }
    }

    _showDropdown() {
        const rect = this._triggerBtn.getBoundingClientRect();
        const containerRect = this._chart.layout._container.getBoundingClientRect();
        this._dropdown.style.left = `${rect.left - containerRect.left}px`;
        this._dropdown.style.top = `${rect.bottom - containerRect.top}px`;
        this._dropdown.style.display = 'block';
        this._dropdownVisible = true;
        document.addEventListener('mousedown', this._closeHandler);
    }

    _hideDropdown() {
        this._dropdown.style.display = 'none';
        this._dropdownVisible = false;
        document.removeEventListener('mousedown', this._closeHandler);
    }

    _selectInterval(value, label) {
        this._currentInterval = value;
        this._triggerBtn.querySelector('.btc-tt-interval-label').textContent = value;

        // Update active states in quick buttons
        const el = this._chart.layout.topToolbarElement;
        el.querySelectorAll('.btc-tt-interval-btn').forEach(btn => {
            btn.classList.toggle('active', btn.textContent === label || btn.textContent === value);
        });
        this._triggerBtn.classList.remove('active');

        // Update dropdown active
        this._dropdown.querySelectorAll('.btc-tt-dropdown-item').forEach(item => {
            item.classList.toggle('active', item.textContent === label);
        });

        this._chart.emit('intervalChanged', value);
    }

    // --- Indicator dropdown ---

    _buildIndicatorDropdown() {
        this._indicatorDropdown = document.createElement('div');
        this._indicatorDropdown.className = 'btc-tt-dropdown btc-tt-indicator-dropdown';
        this._indicatorDropdown.style.display = 'none';

        const header = document.createElement('div');
        header.className = 'btc-tt-dropdown-header';
        header.textContent = 'INDICATORS';
        this._indicatorDropdown.appendChild(header);

        const indicators = IndicatorRegistry.getAll();
        for (const IndicatorClass of indicators) {
            const row = document.createElement('div');
            row.className = 'btc-tt-dropdown-item';
            row.textContent = IndicatorClass.indicatorName;
            row.addEventListener('click', () => {
                const instance = new IndicatorClass();
                this._chart.indicatorManager.addIndicator(instance);
                this._hideIndicatorDropdown();
            });
            this._indicatorDropdown.appendChild(row);
        }

        this._chart.layout._container.appendChild(this._indicatorDropdown);

        this._indicatorCloseHandler = (e) => {
            if (!this._indicatorDropdown.contains(e.target) && !this._indicatorBtn.contains(e.target)) {
                this._hideIndicatorDropdown();
            }
        };
    }

    _toggleIndicatorDropdown() {
        if (this._indicatorDropdownVisible) {
            this._hideIndicatorDropdown();
        } else {
            this._showIndicatorDropdown();
        }
    }

    _showIndicatorDropdown() {
        const rect = this._indicatorBtn.getBoundingClientRect();
        const containerRect = this._chart.layout._container.getBoundingClientRect();
        this._indicatorDropdown.style.left = `${rect.left - containerRect.left}px`;
        this._indicatorDropdown.style.top = `${rect.bottom - containerRect.top}px`;
        this._indicatorDropdown.style.display = 'block';
        this._indicatorDropdownVisible = true;
        document.addEventListener('mousedown', this._indicatorCloseHandler);
    }

    _hideIndicatorDropdown() {
        this._indicatorDropdown.style.display = 'none';
        this._indicatorDropdownVisible = false;
        document.removeEventListener('mousedown', this._indicatorCloseHandler);
    }
}
