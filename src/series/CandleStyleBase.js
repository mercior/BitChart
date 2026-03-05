/**
 * Abstract base class for candle styles (Strategy pattern).
 * Subclasses transform raw OHLCV data and provide a renderer.
 */
export class CandleStyleBase {
    /**
     * Transform raw candles into render-ready bar data.
     * @param {Array} candles - raw OHLCV candles in the visible range
     * @param {TimeScale} timeScale
     * @param {PriceScale} priceScale
     * @param {number} startIndex - the data index of the first candle in the array
     * @returns {Array} array of bar objects with pixel coordinates
     */
    prepareBars(candles, timeScale, priceScale, startIndex) {
        throw new Error('prepareBars() must be implemented by subclass');
    }

    /**
     * Draw the prepared bars onto a canvas context.
     * @param {CanvasRenderingContext2D} ctx
     * @param {Array} bars - output from prepareBars()
     * @param {object} options - style options (colors, etc.)
     */
    drawBars(ctx, bars, options) {
        throw new Error('drawBars() must be implemented by subclass');
    }
}
