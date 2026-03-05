import { DRAWING_TOOLS, COLORS } from '../constants.js';

const TOOL_DEFINITIONS = [
    {
        id: DRAWING_TOOLS.POINTER,
        label: 'Select',
        icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/>
            <path d="M13 13l6 6"/>
        </svg>`,
    },
    {
        id: DRAWING_TOOLS.LINE,
        label: 'Trend Line',
        icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="4" y1="20" x2="20" y2="4"/>
        </svg>`,
    },
    {
        id: DRAWING_TOOLS.EXTENDED_LINE,
        label: 'Extended Line',
        icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="2" y1="22" x2="22" y2="2" stroke-dasharray="2 2"/>
            <line x1="4" y1="20" x2="20" y2="4"/>
        </svg>`,
    },
    {
        id: DRAWING_TOOLS.HORIZONTAL_LINE,
        label: 'Horizontal Line',
        icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="2" y1="12" x2="22" y2="12"/>
            <circle cx="12" cy="12" r="2" fill="currentColor"/>
        </svg>`,
    },
    {
        id: DRAWING_TOOLS.TEXT,
        label: 'Text Note',
        icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 7V4h16v3"/>
            <line x1="12" y1="4" x2="12" y2="20"/>
            <line x1="8" y1="20" x2="16" y2="20"/>
        </svg>`,
    },
];

export class Toolbar {
    constructor(chart) {
        this._chart = chart;
        this._buttons = new Map();
        this._build();
        this._chart.drawingManager.on('toolChanged', () => this._updateActive());
    }

    _build() {
        const el = this._chart.layout.toolbarElement;
        el.innerHTML = '';

        for (const tool of TOOL_DEFINITIONS) {
            const btn = document.createElement('button');
            btn.className = 'btc-toolbar-btn';
            btn.title = tool.label;
            btn.innerHTML = tool.icon;
            btn.addEventListener('click', () => {
                this._chart.drawingManager.setActiveTool(tool.id);
            });
            el.appendChild(btn);
            this._buttons.set(tool.id, btn);
        }

        // Separator
        const sep = document.createElement('div');
        sep.className = 'btc-toolbar-separator';
        el.appendChild(sep);

        // Delete button
        const delBtn = document.createElement('button');
        delBtn.className = 'btc-toolbar-btn';
        delBtn.title = 'Delete Selected';
        delBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
        </svg>`;
        delBtn.addEventListener('click', () => {
            const dm = this._chart.drawingManager;
            if (dm.selectedDrawings.length > 0) {
                dm.removeSelected();
            }
        });
        el.appendChild(delBtn);

        // Separator
        const sep2 = document.createElement('div');
        sep2.className = 'btc-toolbar-separator';
        el.appendChild(sep2);

        // Hide/Show drawings toggle
        this._visBtn = document.createElement('button');
        this._visBtn.className = 'btc-toolbar-btn';
        this._visBtn.title = 'Hide Drawings';
        this._updateVisIcon(true);
        this._visBtn.addEventListener('click', () => {
            const dm = this._chart.drawingManager;
            const visible = dm.toggleVisibility();
            this._updateVisIcon(visible);
            this._visBtn.title = visible ? 'Hide Drawings' : 'Show Drawings';
        });
        el.appendChild(this._visBtn);

        this._updateActive();
    }

    _updateVisIcon(visible) {
        if (visible) {
            this._visBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
            </svg>`;
            this._visBtn.classList.remove('btc-toolbar-btn-muted');
        } else {
            this._visBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
            </svg>`;
            this._visBtn.classList.add('btc-toolbar-btn-muted');
        }
    }

    _updateActive() {
        const activeTool = this._chart.drawingManager.activeTool;
        for (const [id, btn] of this._buttons) {
            btn.classList.toggle('active', id === activeTool);
        }
    }
}
