# BTC Trading Chart

A high-performance, extensible JavaScript candlestick charting library built from scratch with HTML5 Canvas. Designed for cryptocurrency markets — no empty-tick handling, no dependencies, pure vanilla JS with ES modules.

## Features

- **Standard OHLCV candlesticks** with wicks, pixel-perfect rendering at any zoom level
- **Smooth pan & zoom** — click-drag to pan both axes, scroll wheel to zoom, allows zooming far out to below 1 pixel per candle
- **Independent axis scaling** — drag the price axis or time axis to scale each independently
- **Logarithmic scale** toggle for large price ranges
- **Real-time streaming** — push new candle data with `updateCandle()`, chart follows live
- **Drawing tools** — lines, shapes, text annotations with custom colors, line styles * opacity
- **Drawing management** — select, multi-select (Ctrl+click), drag, clone (Ctrl+drag), lock, delete
- **Serializable Drawings** - for saving + loading your drawings
- **Indicators** - Built in indicators & easy interface for creating custom indicators. Indicators support custom settings per indicator & provide UI to adjust them. 
- **Interval selector** — top toolbar with quick-access buttons and full dropdown (ticks through months)
- **Extensible architecture** — Strategy pattern for candle styles, Observer pattern for events, clean separation of Model / Interaction / Rendering layers

## Quick Start

No build step required. Serve the project directory with any static HTTP server:

```bash
# Python
python -m http.server 3000

# Node.js (npx)
npx serve .

# VS Code Live Server, etc.
```

Open `http://localhost:3000` in your browser. The included `index.html` demo generates sample BTC data and streams simulated real-time updates.

## Usage

```html
<div id="chart-container" style="width: 100%; height: 100vh;"></div>

<script type="module">
  import { Chart } from './src/index.js';

  const chart = new Chart(document.getElementById('chart-container'));

  // Load historical data
  chart.setData([
    { time: 1700000000, open: 42000, high: 42500, low: 41800, close: 42200, volume: 1.5 },
    { time: 1700000180, open: 42200, high: 42600, low: 42100, close: 42400, volume: 2.1 },
    // ...more candles
  ]);

  // Stream real-time updates
  chart.updateCandle({
    time: 1700000360,
    open: 42400,
    high: 42700,
    low: 42300,
    close: 42650,
    volume: 0.8,
  });

  // Listen for interval changes from the top toolbar
  chart.on('intervalChanged', (interval) => {
    console.log('User selected interval:', interval);
    // Fetch and load data for the new interval
  });
</script>
```

## Data Format

Each candle is a plain object:

| Field    | Type   | Description                        |
|----------|--------|------------------------------------|
| `time`   | number | Unix timestamp in seconds          |
| `open`   | number | Opening price                      |
| `high`   | number | Highest price in the period        |
| `low`    | number | Lowest price in the period         |
| `close`  | number | Closing price                      |
| `volume` | number | Trade volume (optional, for display)|

## API Reference

### `Chart`

The main entry point. Created by passing a container DOM element.

```js
const chart = new Chart(container, options);
```

**Options** (all optional):

| Option       | Default | Description             |
|-------------|---------|-------------------------|
| `barWidth`   | `8`     | Initial candle body width in pixels |
| `barSpacing` | `2`     | Gap between candles in pixels       |

**Methods:**

| Method | Description |
|--------|-------------|
| `setData(candles[])` | Replace all data and scroll to the most recent candle |
| `updateCandle(candle)` | Update the current candle or append a new one (matched by `time`) |
| `destroy()` | Clean up all DOM elements, event listeners, and animation loops |
| `on(event, callback)` | Subscribe to a chart event |
| `off(event, callback)` | Unsubscribe from a chart event |

**Events:**

| Event | Payload | Description |
|-------|---------|-------------|
| `intervalChanged` | `string` (e.g. `'1m'`, `'4h'`, `'1D'`) | Fired when the user selects a timeframe from the top toolbar |

**Accessible properties:**

| Property | Type | Description |
|----------|------|-------------|
| `dataStore` | `DataStore` | The underlying candle data store |
| `timeScale` | `TimeScale` | Horizontal axis state (scroll position, bar width, zoom) |
| `priceScale` | `PriceScale` | Vertical axis state (price range, auto-fit, log mode) |
| `drawingManager` | `DrawingManager` | All drawings, selection state, active tool |

### `DataStore`

Stores OHLCV candle data sequentially.

| Method | Description |
|--------|-------------|
| `setData(candles[])` | Replace all data |
| `update(candle)` | Update last candle or append if `time` is new |
| `getCandle(index)` | Get candle at index |
| `getRange(from, to)` | Get candles in index range |
| `length` | Number of candles |
| `last` | Most recent candle |

### `TimeScale`

Controls the horizontal axis mapping between candle indices and pixel positions.

| Method / Property | Description |
|-------------------|-------------|
| `scrollBy(px)` | Scroll by pixel delta (positive = right) |
| `scrollToEnd()` | Jump to most recent candle, re-enable follow mode |
| `zoomAt(centerX, factor)` | Zoom in/out at a pixel position |
| `visibleRange()` | Returns `{ from, to }` index range of visible candles |
| `followMode` | `true` if chart auto-scrolls with new data |
| `barWidth` | Current candle body width |
| `barStep` | `barWidth + barSpacing` |

### `PriceScale`

Controls the vertical axis mapping between prices and pixel positions.

| Method / Property | Description |
|-------------------|-------------|
| `priceToY(price)` | Convert a price to a pixel Y coordinate |
| `yToPrice(y)` | Convert a pixel Y to a price |
| `setLogScale(bool)` | Enable or disable logarithmic scale |
| `resetAutoScale()` | Re-enable automatic price fitting |
| `isAutoScale` | Whether the chart auto-fits the Y axis to visible data |
| `isLogScale` | Whether logarithmic mode is active |
| `minPrice` / `maxPrice` | Current visible price range |

### `DrawingManager`

Manages all drawing objects on the chart.

| Method / Property | Description |
|-------------------|-------------|
| `addDrawing(drawing)` | Add a drawing to the chart |
| `removeDrawing(id)` | Remove a drawing by ID |
| `removeSelected()` | Delete all selected drawings |
| `selectDrawing(d, addToSelection?)` | Select a drawing, optionally adding to multi-select |
| `deselectAll()` | Clear selection |
| `setActiveTool(toolId)` | Set the active drawing tool |
| `toggleVisibility()` | Toggle drawing visibility on/off |
| `drawings` | Array of all drawing objects |
| `selectedDrawings` | Array of currently selected drawings |
| `drawingsVisible` | Whether drawings are rendered |

### Drawing Types

All drawings extend `DrawingBase` and share these properties:

| Property | Type | Description |
|----------|------|-------------|
| `id` | `string` | Unique identifier |
| `type` | `string` | `'line'`, `'extendedLine'`, `'horizontalLine'`, or `'text'` |
| `style` | `DrawingStyle` | Color, line width, line style, opacity |
| `isLocked` | `boolean` | Locked drawings can't be dragged |
| `anchors` | `Array<{time, price}>` | Anchor points in data coordinates |

**Available drawing classes:**

| Class | Description | Anchors |
|-------|-------------|---------|
| `LineDrawing` | Finite trend line between two points | 2 |
| `ExtendedLineDrawing` | Ray extending to chart edges | 2 |
| `HorizontalLineDrawing` | Horizontal line at a price level | 1 (price only) |
| `TextDrawing` | Text annotation at a point | 1 |

### `DrawingStyle`

| Property | Default | Description |
|----------|---------|-------------|
| `color` | `'#ffffff'` | Stroke/text color |
| `lineWidth` | `1` | Line thickness (1–5) |
| `lineStyle` | `'solid'` | `'solid'`, `'dashed'`, or `'dotted'` |
| `opacity` | `1.0` | Opacity (0–1) |
| `fillColor` | `null` | Background fill color |
| `fontSize` | `14` | Font size for text drawings |

## Extending Candle Styles

The library uses a Strategy pattern for candlestick rendering. To create a custom style (e.g., Heikin-Ashi), extend `CandleStyleBase`:

```js
import { CandleStyleBase } from './src/index.js';

class HeikinAshiStyle extends CandleStyleBase {
  prepareBars(candles, timeScale, priceScale, startIndex) {
    // Transform OHLCV data into Heikin-Ashi values
    // Return array of bar objects with pixel coordinates
  }

  drawBars(ctx, bars, options) {
    // Draw the bars onto the canvas
  }
}
```

Then apply it:

```js
chart.series.setStyle(new HeikinAshiStyle());
```

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Delete` / `Backspace` | Delete selected drawing(s) |
| `Escape` | Cancel current placement or deselect all |
| `Ctrl + Click` | Add/remove drawing from multi-selection |
| `Ctrl + Drag` | Clone selected drawing(s) |

## Mouse Controls

| Action | Effect |
|--------|--------|
| Click + drag on chart | Pan horizontally and vertically |
| Scroll wheel | Zoom in/out at cursor position |
| Drag price axis (right) | Scale Y axis manually |
| Drag time axis (bottom) | Scale X axis manually |
| Double-click price axis | Reset to auto-fit Y |
| Click drawing | Select it |
| Drag selected drawing | Move it |
| Drag anchor handle | Reshape the drawing |

## Architecture

```
┌─────────────────────────────────────────────────┐
│  Chart (Facade)                                 │
│  Orchestrates all components                    │
├──────────┬──────────┬───────────┬───────────────┤
│  Model   │ Interact │ Renderer  │     GUI       │
├──────────┼──────────┼───────────┼───────────────┤
│DataStore │PanZoom   │Grid       │Toolbar        │
│TimeScale │AxisDrag  │Series     │TopToolbar     │
│PriceScale│Crosshair │Drawing    │DrawingToolbar │
│Crosshair │DrawTool  │Crosshair  │SettingsPanel  │
│Drawings  │          │PriceAxis  │TextInputDialog│
│          │          │TimeAxis   │               │
└──────────┴──────────┴───────────┴───────────────┘
```

**Key patterns:**
- **Strategy** — `CandleStyleBase` allows pluggable candle renderers
- **Observer** — `EventEmitter` decouples components via events (`dataChanged`, `scaleChanged`, `drawingsChanged`, etc.)
- **Facade** — `Chart` provides a clean public API hiding internal complexity
- **State Machine** — `DrawingToolHandler` manages placement/selection/dragging states
- **Layered Canvas** — Three stacked canvases (`bg`, `main`, `ui`) enable selective redraws
- **Dirty Flags** — `RenderScheduler` uses RAF with dirty-flag tracking per layer for 60fps rendering

## Project Structure

```
├── index.html              Demo page with sample data
├── styles.css              All component styles (dark theme)
└── src/
    ├── index.js            Public API exports
    ├── constants.js         Colors, sizes, tool IDs
    ├── utils.js             Math, formatting, canvas helpers
    ├── core/                Chart, Layout, Scheduler, EventEmitter
    ├── model/               DataStore, TimeScale, PriceScale, Crosshair
    ├── series/              CandleStyleBase, StandardCandleStyle, Series
    ├── drawings/            DrawingBase, DrawingManager, DrawingStyle, line/text types
    ├── gui/                 Toolbar, TopToolbar, DrawingToolbar, SettingsPanel, dialogs
    ├── interaction/         PanZoom, AxisDrag, Crosshair, DrawingTool handlers
    └── renderers/           Grid, Series, Drawing, Crosshair, PriceAxis, TimeAxis
```

## Browser Support

Modern browsers with ES module support:
- Chrome 80+
- Firefox 80+
- Safari 14+
- Edge 80+

## License

MIT
