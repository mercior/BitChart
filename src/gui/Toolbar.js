import { DRAWING_TOOLS, COLORS } from '../constants.js';

const ICONS = {
    pointer: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/>
        <path d="M13 13l6 6"/>
    </svg>`,
    line: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="4" y1="20" x2="20" y2="4"/>
    </svg>`,
    extendedLine: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="2" y1="22" x2="22" y2="2" stroke-dasharray="2 2"/>
        <line x1="4" y1="20" x2="20" y2="4"/>
    </svg>`,
    horizontalLine: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="2" y1="12" x2="22" y2="12"/>
        <circle cx="12" cy="12" r="2" fill="currentColor"/>
    </svg>`,
    text: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M4 7V4h16v3"/>
        <line x1="12" y1="4" x2="12" y2="20"/>
        <line x1="8" y1="20" x2="16" y2="20"/>
    </svg>`,
    rectangle: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="5" width="18" height="14" rx="1"/>
    </svg>`,
    triangle: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 3L2 21h20L12 3z"/>
    </svg>`,
    circle: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="9"/>
    </svg>`,
    polygon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 2l8 5v10l-8 5-8-5V7l8-5z"/>
    </svg>`,
    longPosition: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="4" width="18" height="16" rx="1"/>
        <line x1="3" y1="12" x2="21" y2="12" stroke-dasharray="3 2"/>
        <path d="M12 4l3 3h-6l3-3z" fill="#26a69a" stroke="#26a69a"/>
    </svg>`,
    shortPosition: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="4" width="18" height="16" rx="1"/>
        <line x1="3" y1="12" x2="21" y2="12" stroke-dasharray="3 2"/>
        <path d="M12 20l3-3h-6l3 3z" fill="#ef5350" stroke="#ef5350"/>
    </svg>`,
};

const TOOL_GROUPS = [
    { type: 'single', tool: { id: DRAWING_TOOLS.POINTER, label: 'Select' } },
    {
        type: 'group', id: 'lines', children: [
            { id: DRAWING_TOOLS.LINE, label: 'Trend Line' },
            { id: DRAWING_TOOLS.EXTENDED_LINE, label: 'Extended Line' },
            { id: DRAWING_TOOLS.HORIZONTAL_LINE, label: 'Horizontal Line' },
        ],
    },
    {
        type: 'group', id: 'shapes', children: [
            { id: DRAWING_TOOLS.RECTANGLE, label: 'Rectangle' },
            { id: DRAWING_TOOLS.TRIANGLE, label: 'Triangle' },
            { id: DRAWING_TOOLS.CIRCLE, label: 'Circle' },
            { id: DRAWING_TOOLS.POLYGON, label: 'Polygon' },
        ],
    },
    {
        type: 'group', id: 'positions', children: [
            { id: DRAWING_TOOLS.LONG_POSITION, label: 'Long Position' },
            { id: DRAWING_TOOLS.SHORT_POSITION, label: 'Short Position' },
        ],
    },
    { type: 'single', tool: { id: DRAWING_TOOLS.TEXT, label: 'Text Note' } },
];

export class Toolbar {
    constructor(chart) {
        this._chart = chart;
        this._buttons = new Map();
        this._activeToolPerGroup = new Map();
        this._openFlyout = null;
        this._closeFlyoutBound = this._closeFlyout.bind(this);

        for (const g of TOOL_GROUPS) {
            if (g.type === 'group') {
                this._activeToolPerGroup.set(g.id, g.children[0].id);
            }
        }

        this._build();
        this._chart.drawingManager.on('toolChanged', () => this._updateActive());
    }

    _build() {
        const el = this._chart.layout.toolbarElement;
        el.innerHTML = '';

        for (const group of TOOL_GROUPS) {
            if (group.type === 'single') {
                this._buildSingleButton(el, group.tool);
            } else {
                this._buildGroupButton(el, group);
            }
        }

        const sep = document.createElement('div');
        sep.className = 'btc-toolbar-separator';
        el.appendChild(sep);

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

        const sep2 = document.createElement('div');
        sep2.className = 'btc-toolbar-separator';
        el.appendChild(sep2);

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

    _buildSingleButton(container, tool) {
        const btn = document.createElement('button');
        btn.className = 'btc-toolbar-btn';
        btn.title = tool.label;
        btn.innerHTML = ICONS[tool.id] || '';
        btn.addEventListener('click', () => {
            this._chart.drawingManager.setActiveTool(tool.id);
        });
        container.appendChild(btn);
        this._buttons.set(tool.id, btn);
    }

    _buildGroupButton(container, group) {
        const wrapper = document.createElement('div');
        wrapper.className = 'btc-toolbar-group';

        const btn = document.createElement('button');
        btn.className = 'btc-toolbar-btn btc-toolbar-group-btn';
        const activeId = this._activeToolPerGroup.get(group.id);
        const activeTool = group.children.find(c => c.id === activeId) || group.children[0];
        btn.title = activeTool.label;
        btn.innerHTML = ICONS[activeTool.id] || '';

        btn.addEventListener('click', (e) => {
            if (e.target.closest('.btc-toolbar-group-arrow')) return;
            const currentId = this._activeToolPerGroup.get(group.id);
            this._chart.drawingManager.setActiveTool(currentId);
        });

        this._appendArrow(btn, wrapper, group);

        wrapper.appendChild(btn);
        container.appendChild(wrapper);

        for (const child of group.children) {
            this._buttons.set(child.id, btn);
        }
        btn._groupId = group.id;
        btn._group = group;
    }

    _appendArrow(btn, wrapper, group) {
        const arrow = document.createElement('div');
        arrow.className = 'btc-toolbar-group-arrow';
        arrow.addEventListener('click', (e) => {
            e.stopPropagation();
            this._toggleFlyout(wrapper, group, btn);
        });
        btn.appendChild(arrow);
    }

    _toggleFlyout(wrapper, group, triggerBtn) {
        if (this._openFlyout && this._openFlyout._groupId === group.id) {
            this._closeFlyout();
            return;
        }
        this._closeFlyout();

        const flyout = document.createElement('div');
        flyout.className = 'btc-toolbar-flyout';
        flyout._groupId = group.id;

        const header = document.createElement('div');
        header.className = 'btc-toolbar-flyout-header';
        header.textContent = group.id.toUpperCase();
        flyout.appendChild(header);

        for (const child of group.children) {
            const item = document.createElement('div');
            item.className = 'btc-toolbar-flyout-item';
            const activeId = this._activeToolPerGroup.get(group.id);
            if (child.id === activeId) item.classList.add('active');

            const icon = document.createElement('span');
            icon.className = 'btc-toolbar-flyout-icon';
            icon.innerHTML = ICONS[child.id] || '';
            item.appendChild(icon);

            const label = document.createElement('span');
            label.className = 'btc-toolbar-flyout-label';
            label.textContent = child.label;
            item.appendChild(label);

            item.addEventListener('click', () => {
                this._activeToolPerGroup.set(group.id, child.id);
                triggerBtn.innerHTML = ICONS[child.id] || '';
                this._appendArrow(triggerBtn, wrapper, group);
                triggerBtn.title = child.label;
                this._chart.drawingManager.setActiveTool(child.id);
                this._closeFlyout();
            });

            flyout.appendChild(item);
        }

        const chartContainer = this._chart.layout._container;
        chartContainer.appendChild(flyout);

        const btnRect = triggerBtn.getBoundingClientRect();
        const containerRect = chartContainer.getBoundingClientRect();
        flyout.style.left = `${btnRect.right - containerRect.left + 4}px`;
        flyout.style.top = `${btnRect.top - containerRect.top - 4}px`;

        this._openFlyout = flyout;

        setTimeout(() => {
            document.addEventListener('mousedown', this._closeFlyoutBound);
        }, 0);
    }

    _closeFlyout(e) {
        if (this._openFlyout) {
            if (e && (this._openFlyout.contains(e.target) ||
                      e.target.closest('.btc-toolbar-group-arrow'))) return;
            this._openFlyout.remove();
            this._openFlyout = null;
        }
        document.removeEventListener('mousedown', this._closeFlyoutBound);
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
        const updatedGroups = new Set();

        for (const [toolId, btn] of this._buttons) {
            if (btn._groupId) {
                if (updatedGroups.has(btn._groupId)) continue;
                updatedGroups.add(btn._groupId);

                const group = btn._group;
                const isGroupActive = group.children.some(c => c.id === activeTool);
                btn.classList.toggle('active', isGroupActive);
                if (isGroupActive) {
                    this._activeToolPerGroup.set(btn._groupId, activeTool);
                    btn.title = group.children.find(c => c.id === activeTool)?.label || '';
                    btn.innerHTML = ICONS[activeTool] || '';
                    this._appendArrow(btn, btn.parentElement, group);
                }
            } else {
                btn.classList.toggle('active', toolId === activeTool);
            }
        }
    }
}
