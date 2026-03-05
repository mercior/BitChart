import { SMAIndicator } from './SMAIndicator.js';
import { EMAIndicator } from './EMAIndicator.js';
import { BollingerBandsIndicator } from './BollingerBandsIndicator.js';
import { SMABandsIndicator } from './SMABandsIndicator.js';

/**
 * Global registry of available indicator classes.
 * Users can call IndicatorRegistry.register() to add custom indicators.
 */
export class IndicatorRegistry {
    static _indicators = new Map();

    static register(indicatorClass) {
        this._indicators.set(indicatorClass.shortName, indicatorClass);
    }

    static unregister(shortName) {
        this._indicators.delete(shortName);
    }

    static get(shortName) {
        return this._indicators.get(shortName) || null;
    }

    static getAll() {
        return Array.from(this._indicators.values());
    }
}

IndicatorRegistry.register(SMAIndicator);
IndicatorRegistry.register(EMAIndicator);
IndicatorRegistry.register(BollingerBandsIndicator);
IndicatorRegistry.register(SMABandsIndicator);
