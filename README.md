# GeoJSON Map Fit Mercator

[GeoJSON Map Fit Mercator](https://tristandavey.com/geojson-map-fit-mercator/) finds the optimal bearing, zoom and 
center point for fitting a set of [GeoJSON](https://geojson.org/) features in a 
[Mapbox GL](https://docs.mapbox.com/mapbox-gl-js/guides) or [MapLibre GL](https://maplibre.org/) viewport. The optimal 
viewport is calculated by determining the optimal bearing and zoom level to present a 
[minimum bounding rectangle (MBR)](https://en.wikipedia.org/wiki/Minimum_bounding_rectangle) all the given GeoJSON 
features. This can allow you to render more detailed, better fitting maps than the default [bounding box](https://docs.mapbox.com/help/glossary/bounding-box/)
behaviour which only describes a x/y aligned minimum bounding rectangle.

Checkout the [demo](https://tristandavey.com/geojson-map-fit-mercator#preview) to see the library in action.

## Installation

### NPM

```bash   
npm install geojson-map-fit-mercator
```

### Yarn

```bash
yarn add geojson-map-fit-mercator
```

## Usage

### EcmaScript Module (ESM)

```javascript
import { mapFitFeatures } from 'geojson-map-fit-mercator';
```

### CommonJS Module

```javascript
const { mapFitFeatures } = require('geojson-map-fit-mercator');
```

### Map Initialisation Example

`mapFitFeatures` returns an object describing the optimal center point (`center`), bearing (`bearing`) and zoom level 
(`zoom`) to display the given GeoJSON features in a given resolution map.

```javascript
import { mapFitFeatures } from 'geojson-map-fit-mercator';
import maplibregl from 'maplibre-gl';
import mapData from './map-data.json' with { type: 'json' }; // Load GeoJSON data

const { bearing, center, zoom } = mapFitFeatures(mapData, [600, 400]);

const map = new new maplibregl.Map({
  container: 'map', // container ID for a 600px by 400px element
  style: 'https://demotiles.maplibre.org/style.json',
  center: center, // starting position [lng, lat]
  zoom: zoom, // starting zoom
  bearing: bearing // starting bearing
});

...
```

Additional options for `mapFitFeatures` such as map padding, zoom and bearing preferences and tile-size 
are described in the [API](#api) section below. 

## API

### `mapFitFeatures(geojson: GeoJSON, dimensions: [number, number], options: mapFitOptions): { bearing: number, center: LonLat, zoom: number }`

Finds the optimal bearing, zoom and center point for fitting all features in a map viewport.

#### Parameters

- `geojson: GeoJSON` - A GeoJSON object containing features to fit in the map viewport.
- `dimensions: [number, number]` - The dimensions of the map viewport in pixels as a [x, y] array.
- `options: mapFitOptions` - Options for the map fitting algorithm and tile calculations.

#### Returns

- `center: LonLat` - The optimal center point for the map viewport expressed as [lon, lat] array.
- `bearing: number` - The optimal bearing for the map viewport.
- `zoom: number` - The optimal zoom level for the map viewport. A number between 0 and `options.maxZoom`. If the `options.floatZoom` is set to `false` it will return only a whole number. 

### `mapFitOptions`

Options for the map fitting algorithm and tile calculations.

#### Properties

- `padding: mapFitPadding` - The padding to apply to the map viewport. The feature fitting will scale the map down to ensure this many pixels pad the features on each side of the map. Default: `{ top: 0, bottom: 0, left: 0, right: 0 }`.
- `maxZoom: number` - The maximum zoom level to allow. Default: `23`.
- `floatZoom: boolean` - If `true` the zoom level will be a floating point number. If set to `false` only whole number zoom levels will be returned. Default: `true`.
- `preferredBearing: number` - Determines which orientation of the bounding rectangle the algorithm will attempt to orient upwards. Eg. `0` will keep north pointing in an upwards angle, while `180` will mean south is pointing at an upwards angle. Default: `0`.
- `tileSize: number` - The size of the map tiles in pixels. By default for Mapbox GL JS and MapLibre GL JS this is `512`. Default: `512`.










