/**
 * Clamp a value between min and max.
 */
export function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

/**
 * Round to pixel boundary for crisp 1px lines.
 */
export function pixelSnap(x) {
    return Math.round(x) + 0.5;
}

/**
 * Generate a unique id string.
 */
let _idCounter = 0;
export function uid() {
    return `id_${++_idCounter}_${Date.now().toString(36)}`;
}

/**
 * Format a price value with appropriate decimal places.
 */
export function formatPrice(price, decimals = 2) {
    if (price >= 10000) decimals = 0;
    else if (price >= 1000) decimals = 1;
    else if (price >= 1) decimals = 2;
    else decimals = 6;
    return price.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    });
}

/**
 * Format a unix timestamp (seconds) into a display string.
 */
export function formatTime(timestamp, barWidthPixels) {
    const d = new Date(timestamp * 1000);
    if (barWidthPixels > 20) {
        return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    }
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${month}/${day} ${hours}:${minutes}`;
}

/**
 * Compute nice tick values for an axis range.
 */
export function niceTicksForRange(min, max, targetTickCount) {
    const range = max - min;
    if (range <= 0) return [min];

    const roughStep = range / targetTickCount;
    const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
    const residual = roughStep / magnitude;

    let niceStep;
    if (residual <= 1.5) niceStep = magnitude;
    else if (residual <= 3.5) niceStep = 2 * magnitude;
    else if (residual <= 7.5) niceStep = 5 * magnitude;
    else niceStep = 10 * magnitude;

    const ticks = [];
    let tick = Math.ceil(min / niceStep) * niceStep;
    while (tick <= max) {
        ticks.push(tick);
        tick += niceStep;
    }
    return ticks;
}

/**
 * Point-to-segment distance for hit testing lines.
 */
export function pointToSegmentDistance(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return Math.hypot(px - x1, py - y1);

    let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
    t = clamp(t, 0, 1);
    return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

/**
 * Point-to-infinite-line distance for hit testing extended lines.
 */
export function pointToLineDistance(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return Math.hypot(px - x1, py - y1);
    return Math.abs(dy * px - dx * py + x2 * y1 - y2 * x1) / Math.sqrt(lenSq);
}

/**
 * Set the canvas dimensions accounting for devicePixelRatio.
 */
export function setupCanvasSize(canvas, width, height) {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    return ctx;
}

/**
 * Apply a line dash pattern to a canvas context.
 */
export function applyLineStyle(ctx, lineStyle) {
    switch (lineStyle) {
        case 'dashed':
            ctx.setLineDash([6, 4]);
            break;
        case 'dotted':
            ctx.setLineDash([2, 2]);
            break;
        default:
            ctx.setLineDash([]);
            break;
    }
}
