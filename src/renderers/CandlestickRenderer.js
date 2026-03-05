// This file is a standalone utility renderer kept for reference / future use.
// The actual candle drawing is done via the StandardCandleStyle strategy class.
// See src/series/StandardCandleStyle.js

import { COLORS } from '../constants.js';
import { pixelSnap } from '../utils.js';

export class CandlestickRenderer {
    draw(ctx, bars, options = {}) {
        const upColor = options.upColor || COLORS.candleUp;
        const downColor = options.downColor || COLORS.candleDown;
        const barWidth = options.barWidth || 6;
        const halfWidth = Math.max(1, Math.floor(barWidth / 2));

        for (const bar of bars) {
            const color = bar.isUp ? upColor : downColor;
            const x = bar.x;
            const wickX = pixelSnap(x);

            ctx.strokeStyle = color;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(wickX, Math.round(bar.yHigh));
            ctx.lineTo(wickX, Math.round(bar.yLow));
            ctx.stroke();

            const bodyTop = Math.round(Math.min(bar.yOpen, bar.yClose));
            const bodyHeight = Math.max(1, Math.round(Math.abs(bar.yClose - bar.yOpen)));
            ctx.fillStyle = color;
            ctx.fillRect(x - halfWidth, bodyTop, halfWidth * 2, bodyHeight);
        }
    }
}
