import { CandleStyleBase } from './CandleStyleBase.js';
import { COLORS } from '../constants.js';
import { pixelSnap } from '../utils.js';

export class StandardCandleStyle extends CandleStyleBase {
    prepareBars(candles, timeScale, priceScale, startIndex) {
        const bars = [];
        for (let i = 0; i < candles.length; i++) {
            const c = candles[i];
            const dataIndex = startIndex + i;
            const x = Math.round(timeScale.indexToX(dataIndex));
            bars.push({
                x,
                yOpen: priceScale.priceToY(c.open),
                yClose: priceScale.priceToY(c.close),
                yHigh: priceScale.priceToY(c.high),
                yLow: priceScale.priceToY(c.low),
                isUp: c.close >= c.open,
                candle: c,
                index: dataIndex,
            });
        }
        return bars;
    }

    drawBars(ctx, bars, options = {}) {
        const upColor = options.upColor || COLORS.candleUp;
        const downColor = options.downColor || COLORS.candleDown;
        const barWidth = options.barWidth || 6;
        const halfWidth = Math.max(1, Math.floor(barWidth / 2));

        // Batch by color: draw all up candles then all down candles for fewer state changes
        for (let pass = 0; pass < 2; pass++) {
            const isUpPass = pass === 0;
            const color = isUpPass ? upColor : downColor;
            ctx.fillStyle = color;
            ctx.strokeStyle = color;
            ctx.lineWidth = 1;

            for (const bar of bars) {
                if (bar.isUp !== isUpPass) continue;

                const x = bar.x;
                const wickX = pixelSnap(x);

                // Wick
                ctx.beginPath();
                ctx.moveTo(wickX, Math.round(bar.yHigh));
                ctx.lineTo(wickX, Math.round(bar.yLow));
                ctx.stroke();

                // Body
                const bodyTop = Math.round(Math.min(bar.yOpen, bar.yClose));
                const bodyBottom = Math.round(Math.max(bar.yOpen, bar.yClose));
                const bodyHeight = Math.max(1, bodyBottom - bodyTop);

                ctx.fillRect(x - halfWidth, bodyTop, halfWidth * 2, bodyHeight);
            }
        }
    }
}
