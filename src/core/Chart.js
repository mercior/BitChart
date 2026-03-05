import { EventEmitter } from './EventEmitter.js';
import { ChartLayout } from './ChartLayout.js';
import { RenderScheduler } from './RenderScheduler.js';
import { DataStore } from '../model/DataStore.js';
import { TimeScale } from '../model/TimeScale.js';
import { PriceScale } from '../model/PriceScale.js';
import { Crosshair } from '../model/Crosshair.js';
import { Series } from '../series/Series.js';
import { StandardCandleStyle } from '../series/StandardCandleStyle.js';
import { GridRenderer } from '../renderers/GridRenderer.js';
import { SeriesRenderer } from '../renderers/SeriesRenderer.js';
import { CrosshairRenderer } from '../renderers/CrosshairRenderer.js';
import { PriceAxisRenderer } from '../renderers/PriceAxisRenderer.js';
import { TimeAxisRenderer } from '../renderers/TimeAxisRenderer.js';
import { DrawingRenderer } from '../renderers/DrawingRenderer.js';
import { IndicatorRenderer } from '../renderers/IndicatorRenderer.js';
import { InteractionManager } from '../interaction/InteractionManager.js';
import { DrawingManager } from '../drawings/DrawingManager.js';
import { IndicatorManager } from '../indicators/IndicatorManager.js';
import { Toolbar } from '../gui/Toolbar.js';
import { TopToolbar } from '../gui/TopToolbar.js';
import { StylePopup } from '../gui/StylePopup.js';
import { DrawingToolbar } from '../gui/DrawingToolbar.js';
import { TextInputDialog } from '../gui/TextInputDialog.js';
import { SettingsPanel } from '../gui/SettingsPanel.js';
import { IndicatorLegend } from '../gui/IndicatorLegend.js';
import { IndicatorSettingsDialog } from '../gui/IndicatorSettingsDialog.js';
import { SIZES } from '../constants.js';

export class Chart extends EventEmitter {
    constructor(container, options = {}) {
        super();
        this._options = Object.assign({
            barWidth: SIZES.defaultBarWidth,
            barSpacing: SIZES.defaultBarSpacing,
        }, options);

        this.layout = new ChartLayout(container);
        this.dataStore = new DataStore();
        this.timeScale = new TimeScale(this.layout, this._options.barWidth, this._options.barSpacing);
        this.priceScale = new PriceScale(this.layout);
        this.crosshair = new Crosshair();
        this.series = new Series(this.dataStore, new StandardCandleStyle());
        this.drawingManager = new DrawingManager();
        this.indicatorManager = new IndicatorManager();
        this.scheduler = new RenderScheduler();

        this._setupRenderers();
        this._setupInteraction();
        this._setupToolbar();
        this._bindEvents();

        this.scheduler.start();
    }

    _setupRenderers() {
        const gridRenderer = new GridRenderer(this);
        const seriesRenderer = new SeriesRenderer(this);
        const indicatorRenderer = new IndicatorRenderer(this);
        const drawingRenderer = new DrawingRenderer(this);
        const crosshairRenderer = new CrosshairRenderer(this);
        const priceAxisRenderer = new PriceAxisRenderer(this);
        const timeAxisRenderer = new TimeAxisRenderer(this);

        this.scheduler.registerRenderer('bg', gridRenderer);
        this.scheduler.registerRenderer('main', seriesRenderer);
        this.scheduler.registerRenderer('main', indicatorRenderer);
        this.scheduler.registerRenderer('main', drawingRenderer);
        this.scheduler.registerRenderer('ui', crosshairRenderer);
        this.scheduler.registerRenderer('priceAxis', priceAxisRenderer);
        this.scheduler.registerRenderer('timeAxis', timeAxisRenderer);

        this._renderers = {
            grid: gridRenderer,
            series: seriesRenderer,
            indicator: indicatorRenderer,
            drawing: drawingRenderer,
            crosshair: crosshairRenderer,
            priceAxis: priceAxisRenderer,
            timeAxis: timeAxisRenderer,
        };
    }

    _setupInteraction() {
        this.interactionManager = new InteractionManager(this);
    }

    _setupToolbar() {
        this.indicatorSettingsDialog = new IndicatorSettingsDialog(this);
        this.topToolbar = new TopToolbar(this);
        this.toolbar = new Toolbar(this);
        this.stylePopup = new StylePopup(this);
        this.drawingToolbar = new DrawingToolbar(this);
        this.textInputDialog = new TextInputDialog(this);
        this.settingsPanel = new SettingsPanel(this);
        this.indicatorLegend = new IndicatorLegend(this);
    }

    _bindEvents() {
        this.dataStore.on('dataChanged', () => {
            this._updateScalesAfterDataChange();
            this.indicatorManager.setCandles(this.dataStore.getAll());
            this.scheduler.invalidate('all');
        });

        this.indicatorManager.on('indicatorsChanged', () => {
            this.scheduler.invalidate('main');
        });

        this.timeScale.on('scaleChanged', () => {
            if (this.priceScale.isAutoScale) {
                this._autoFitPriceScale();
            }
            this.scheduler.invalidate('all');
        });

        this.priceScale.on('scaleChanged', () => {
            this.scheduler.invalidate('all');
        });

        this.crosshair.on('crosshairMoved', () => {
            this.scheduler.invalidate('ui');
            this.scheduler.invalidate('priceAxis');
            this.scheduler.invalidate('timeAxis');
        });

        this.drawingManager.on('drawingsChanged', () => {
            this.scheduler.invalidate('main');
            this.scheduler.invalidate('ui');
        });

        this.drawingManager.on('selectionChanged', () => {
            this.scheduler.invalidate('main');
            this.scheduler.invalidate('ui');
        });

        const resizeObs = new ResizeObserver(() => {
            this.layout.resize();
            this.timeScale.setChartWidth(this.layout.chartWidth);
            if (this.priceScale.isAutoScale) {
                this._autoFitPriceScale();
            }
            this.scheduler.invalidate('all');
        });
        resizeObs.observe(this.layout._container);
        this._resizeObs = resizeObs;
    }

    _updateScalesAfterDataChange() {
        this.timeScale.setDataLength(this.dataStore.length);
        this._autoFitPriceScale();
    }

    _autoFitPriceScale() {
        if (!this.priceScale.isAutoScale) return;
        const range = this.timeScale.visibleRange();
        if (!range) return;
        const candles = this.dataStore.getRange(range.from, range.to);
        this.priceScale.autoFitToData(candles);
    }

    setData(ohlcvArray) {
        this.dataStore.setData(ohlcvArray);
        this.timeScale.scrollToEnd();
    }

    updateCandle(candle) {
        const wasFollowing = this.timeScale.followMode;
        this.dataStore.update(candle);
        if (wasFollowing) {
            this.timeScale.scrollToEnd();
        }
        this._autoFitPriceScale();
        this.scheduler.invalidate('main');
        this.scheduler.invalidate('priceAxis');
    }

    destroy() {
        this.scheduler.stop();
        this.interactionManager.destroy();
        this._resizeObs.disconnect();
        this.layout.destroy();
        this.removeAllListeners();
    }
}
