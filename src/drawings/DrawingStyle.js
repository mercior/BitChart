export class DrawingStyle {
    constructor(overrides = {}) {
        this.color = overrides.color || '#ffffff';
        this.lineWidth = overrides.lineWidth || 1;
        this.lineStyle = overrides.lineStyle || 'solid'; // 'solid', 'dashed', 'dotted'
        this.opacity = overrides.opacity !== undefined ? overrides.opacity : 1.0;
        this.fillColor = overrides.fillColor || null;
        this.fontSize = overrides.fontSize || 14;
    }

    clone() {
        return new DrawingStyle({
            color: this.color,
            lineWidth: this.lineWidth,
            lineStyle: this.lineStyle,
            opacity: this.opacity,
            fillColor: this.fillColor,
            fontSize: this.fontSize,
        });
    }

    apply(overrides) {
        Object.assign(this, overrides);
    }
}
