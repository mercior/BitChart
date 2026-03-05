export class TextInputDialog {
    constructor(chart) {
        this._chart = chart;
        this._el = null;
        this._resolve = null;
        this._build();
    }

    _build() {
        this._el = document.createElement('div');
        this._el.className = 'btc-text-dialog-overlay';
        this._el.style.display = 'none';

        const panel = document.createElement('div');
        panel.className = 'btc-text-dialog';

        const title = document.createElement('div');
        title.className = 'btc-text-dialog-title';
        title.textContent = 'Enter Text';
        panel.appendChild(title);

        this._input = document.createElement('input');
        this._input.type = 'text';
        this._input.className = 'btc-text-dialog-input';
        this._input.placeholder = 'Type your note...';
        this._input.spellcheck = false;
        panel.appendChild(this._input);

        const actions = document.createElement('div');
        actions.className = 'btc-text-dialog-actions';

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'btc-text-dialog-btn btc-text-dialog-cancel';
        cancelBtn.textContent = 'Cancel';
        cancelBtn.addEventListener('click', () => this._finish(null));
        actions.appendChild(cancelBtn);

        const okBtn = document.createElement('button');
        okBtn.className = 'btc-text-dialog-btn btc-text-dialog-ok';
        okBtn.textContent = 'OK';
        okBtn.addEventListener('click', () => this._finish(this._input.value));
        actions.appendChild(okBtn);

        panel.appendChild(actions);
        this._el.appendChild(panel);

        this._input.addEventListener('keydown', (e) => {
            e.stopPropagation();
            if (e.key === 'Enter') this._finish(this._input.value);
            if (e.key === 'Escape') this._finish(null);
        });

        this._el.addEventListener('mousedown', (e) => {
            if (e.target === this._el) this._finish(null);
        });

        this._chart.layout._container.appendChild(this._el);
    }

    show(initialValue = '', titleText = 'Enter Text') {
        return new Promise((resolve) => {
            this._resolve = resolve;
            this._el.querySelector('.btc-text-dialog-title').textContent = titleText;
            this._input.value = initialValue;
            this._el.style.display = 'flex';
            requestAnimationFrame(() => {
                this._input.focus();
                this._input.select();
            });
        });
    }

    _finish(value) {
        this._el.style.display = 'none';
        if (this._resolve) {
            this._resolve(value);
            this._resolve = null;
        }
    }
}
