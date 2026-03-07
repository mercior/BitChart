import { LineDrawing } from './LineDrawing.js';
import { ExtendedLineDrawing } from './ExtendedLineDrawing.js';
import { HorizontalLineDrawing } from './HorizontalLineDrawing.js';
import { TextDrawing } from './TextDrawing.js';
import { RectangleDrawing } from './RectangleDrawing.js';
import { TriangleDrawing } from './TriangleDrawing.js';
import { CircleDrawing } from './CircleDrawing.js';
import { PolygonDrawing } from './PolygonDrawing.js';
import { LongPositionDrawing } from './LongPositionDrawing.js';
import { ShortPositionDrawing } from './ShortPositionDrawing.js';

const CONSTRUCTORS = {
    line: (data, ds) => {
        const d = new LineDrawing(0, 0, 0, 0);
        d._applyBaseJSON(data, ds);
        return d;
    },
    extendedLine: (data, ds) => {
        const d = new ExtendedLineDrawing(0, 0, 0, 0);
        d._applyBaseJSON(data, ds);
        return d;
    },
    horizontalLine: (data, ds) => {
        const d = new HorizontalLineDrawing(0);
        d._applyBaseJSON(data, ds);
        return d;
    },
    text: (data, ds) => {
        const d = new TextDrawing(0, 0, data.text || 'Text');
        d._applyBaseJSON(data, ds);
        d.text = data.text || 'Text';
        d.fontFamily = data.fontFamily || 'Trebuchet MS';
        return d;
    },
    rectangle: (data, ds) => {
        const d = new RectangleDrawing(0, 0, 0, 0);
        d._applyBaseJSON(data, ds);
        return d;
    },
    triangle: (data, ds) => {
        const d = new TriangleDrawing(0, 0);
        d._applyBaseJSON(data, ds);
        d._placementStep = 2;
        return d;
    },
    circle: (data, ds) => {
        const d = new CircleDrawing(0, 0, 0, 0);
        d._applyBaseJSON(data, ds);
        return d;
    },
    polygon: (data, ds) => {
        const d = new PolygonDrawing(0, 0);
        d._applyBaseJSON(data, ds);
        d._pendingPoint = null;
        return d;
    },
    longPosition: (data, ds) => {
        const d = new LongPositionDrawing(0, 0);
        d._applyBaseJSON(data, ds);
        d.width = data.width || 40;
        d.qty = data.qty || 0.1;
        d.accountSize = data.accountSize || 10000;
        return d;
    },
    shortPosition: (data, ds) => {
        const d = new ShortPositionDrawing(0, 0);
        d._applyBaseJSON(data, ds);
        d.width = data.width || 40;
        d.qty = data.qty || 0.1;
        d.accountSize = data.accountSize || 10000;
        return d;
    },
};

export function createDrawingFromJSON(data, dataStore) {
    const factory = CONSTRUCTORS[data.type];
    if (!factory) {
        throw new Error(`Unknown drawing type: ${data.type}`);
    }
    return factory(data, dataStore);
}
