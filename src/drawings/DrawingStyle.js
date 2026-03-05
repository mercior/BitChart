export class DrawingStyle {
    constructor(overrides = {}) {
        this.color = overrides.color || '#ffffff';
        this.lineWidth = overrides.lineWidth || 1;
        this.lineStyle = overrides.lineStyle || 'solid';
        this.opacity = overrides.opacity !== undefined ? overrides.opacity : 1.0;
        this.fillColor = overrides.fillColor || null;
        this.fillOpacity = overrides.fillOpacity !== undefined ? overrides.fillOpacity : 0.2;
        this.borderOpacity = overrides.borderOpacity !== undefined ? overrides.borderOpacity : 1.0;
        this.fontSize = overrides.fontSize || 14;
    }

    clone() {
        return new DrawingStyle({
            color: this.color,
            lineWidth: this.lineWidth,
            lineStyle: this.lineStyle,
            opacity: this.opacity,
            fillColor: this.fillColor,
            fillOpacity: this.fillOpacity,
            borderOpacity: this.borderOpacity,
            fontSize: this.fontSize,
        });
    }

    apply(overrides) {
        Object.assign(this, overrides);
    }
}
