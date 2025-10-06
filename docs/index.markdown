---
---

Given a set of [GeoJSON](https://geojson.org/) features finds the optimal bearing, zoom and center point for fitting 
all features in a [Mapbox GL](https://docs.mapbox.com/mapbox-gl-js/guides) or [MapLibre GL](https://maplibre.org/) 
viewport. The optimal viewport is calculated by determining the optimal bearing and zoom level to present a
[minimum bounding rectangle (MBR)](https://en.wikipedia.org/wiki/Minimum_bounding_rectangle) of all the given GeoJSON
features. This can allow you to render more detailed, better fitting maps than the default 
[bounding box](https://docs.mapbox.com/help/glossary/bounding-box/) behaviour which only describes a x/y aligned 
minimum bounding rectangle.

### Preview

<form>
  <div id="map-main-preview-area">
    <fieldset>
      <legend>Fitting Options</legend>
      <input name="map-main-preview-fit" id="map-main-preview-fit-bestFit" type="radio" value="bestFit" checked>
      <label class="map-main-preview-fit-label" for="map-main-preview-fit-bestFit">This Library</label>
      <input name="map-main-preview-fit" id="map-main-preview-fit-bbox" type="radio" value="bbox">
      <label class="map-main-preview-fit-label" for="map-main-preview-fit-bbox">Bounding Box</label>
    </fieldset>

    <div id="map-main-preview" class="map-preview"></div>

    <div id="map-main-preview-info">
      <div>
        <div class="map-main-preview-info-label">Center:</div>
        <div class="map-main-preview-info-value" id="map-main-preview-info-center"></div>
      </div>
      <div>
        <div class="map-main-preview-info-label">Bearing:</div>
        <div class="map-main-preview-info-value" id="map-main-preview-info-bearing"></div>
      </div>
      <div>
        <div class="map-main-preview-info-label">Zoom:</div>
        <div class="map-main-preview-info-value" id="map-main-preview-info-zoom"></div>
      </div>
    </div>
  </div>
</form>

## Usage

`mapFitFeatures` returns an object describing the optimal center point (`center`), bearing (`bearing`) and zoom level
(`zoom`) to display the given GeoJSON features in a given resolution map.

<div id="code-preview-area">
  <fieldset>
    <legend>Mapping Library </legend>
    <input name="code-preview-library" id="code-preview-library-maplibre" type="radio" value="maplibre" checked>
    <label class="code-preview-library-label" for="code-preview-library-maplibre">MapLibre GL JS</label>
    <input name="code-preview-library" id="code-preview-library-mapbox" type="radio" value="mapbox">
    <label class="code-preview-library-label" for="code-preview-library-mapbox">Mapbox GL JS</label>
  </fieldset>
  <pre id="code-preview-maplibre">
    <code>
import { mapFitFeatures } from 'geojson-map-fit-mercator';
import maplibregl from 'maplibre-gl';
import mapData from './map-data.json' with { type: 'json' }; // Load GeoJSON data

const { bearing, center, zoom } = mapFitFeatures(
  mapData,
  [600, 300]
);

const map = new new maplibregl.Map({
  container: 'map', // container ID for a 600px by 300px element
  style: 'https://demotiles.maplibre.org/style.json',
  center: center, // starting position [lng, lat]
  zoom: zoom, // starting zoom
  bearing: bearing // starting bearing
});

...
    </code>
  </pre>
  <pre id="code-preview-mapbox" style="display: none;">
    <code>
import { mapFitFeatures } from 'geojson-map-fit-mercator';
import mapboxgl from 'mapbox-gl';
import mapData from './map-data.json' with { type: 'json' }; // Load GeoJSON data

const { bearing, center, zoom } = mapFitFeatures(
  mapData,
  [600, 300]
);

const map = new new mapboxgl.Map({
  container: 'map', // container ID for a 600px by 400px element
  center: center, // starting position [lng, lat]
  zoom: zoom, // starting zoom
  bearing: bearing // starting bearing
});

...
    </code>
  </pre>
</div>

#### Padding

You can add padding around the features in the viewport by passing an object to the `padding` option of `mapFitFeatures`.
This padding object is identical to the [Mapbox GL JS `paddingOptions` object](https://docs.mapbox.com/mapbox-gl-js/api/properties/#paddingoptions) and [MapLibre GL JS `paddingOptions` object](https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/PaddingOptions/).

```javascript
  mapFitFeatures(
    mapData,
    [600, 300],
    {
      padding: {
        top: 50,
        bottom: 50,
        left: 100,
        right: 100
      }
    }
  );
```

<div id="map-padding-preview" class="map-preview"></div>

#### Bearing Preference

You can specify a preferred bearing for the map by passing the `bearing` option to `mapFitFeatures`. The preferred 
bearing will be used to pick the preferred orientation of the map to fit the minimum bounding rectangle of the features.
This defaults to `0` which prefers to point the map in a northerly bearing.

```javascript
  mapFitFeatures(
    mapData,
    [600, 300],
    {
      preferredBearing: 180 // Prefer to point the map south
    }
  );
```

<div id="map-bearing-preview" class="map-preview"></div>

### Additional Features and Documentation

A full set of options and parameter descriptions for `mapFitFeatures` such as tile-size and zoom preferences are 
described in the [API section of the Readme]({{ site.api_docs_url }}).
