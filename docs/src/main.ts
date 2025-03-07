import { Map } from 'maplibre-gl';
import { mapFitFeatures } from '../../src/index';
import * as turf from '@turf/turf';
import type { GeoJSON } from 'geojson';
import type { LngLatBoundsLike } from 'maplibre-gl';

import sampleData from './sampledata.json' with {type: 'json'};

import 'maplibre-gl/dist/maplibre-gl.css';

window.addEventListener("load", (event) => {
  setupMapMainPreview();
  setupPaddingMap();
  setupBearingMap();
  setupCodePreview();
});

function setupMapMainPreview() {
  const padding = {
    left: 10,
    right: 10,
    top: 10,
    bottom: 10
  }
  const bestFit = mapFitFeatures(
    sampleData as GeoJSON.FeatureCollection,
    [600, 300],
    {maxZoom: 8, padding});
  const boundingBox = turf.bbox(sampleData as GeoJSON.FeatureCollection);

  document.getElementById('map-main-preview-fit-bestFit').addEventListener('change', function() {
    const radioButton = this as HTMLInputElement;

    if (radioButton.checked) {
      previewMap.easeTo({
        center: bestFit.center,
        bearing: bestFit.bearing,
        zoom: bestFit.zoom
      });
    }
  });

  document.getElementById('map-main-preview-fit-bbox').addEventListener('change', function() {
    const radioButton = this as HTMLInputElement;

    if (radioButton.checked) {
      previewMap.fitBounds(boundingBox as LngLatBoundsLike, {padding});
    }
  });

  const previewMap = new Map({
    container: 'map-main-preview',
    style: 'https://demotiles.maplibre.org/style.json',
    center: bestFit.center,
    bearing: bestFit.bearing,
    zoom: bestFit.zoom,
    interactive: false,
  });

  addSampleDataToMap(previewMap);

  function updateMapInfo() {
    document.getElementById('map-main-preview-info-center').innerText = `${previewMap.getCenter().toArray().map((coord => coord.toFixed(4))).join(', ')}`;
    document.getElementById('map-main-preview-info-zoom').innerText = `${previewMap.getZoom().toFixed(2)}`;
    document.getElementById('map-main-preview-info-bearing').innerText = `${previewMap.getBearing().toFixed(2)}`;
  }

  previewMap.on('move', () => {
    updateMapInfo();
  });

  updateMapInfo();
}

function setupPaddingMap() {
  const fit = mapFitFeatures(
    sampleData as GeoJSON.FeatureCollection,
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

  const paddingMap = new Map({
    container: 'map-padding-preview',
    style: 'https://demotiles.maplibre.org/style.json',
    center: fit.center,
    bearing: fit.bearing,
    zoom: fit.zoom,
    interactive: false,
  });

  addSampleDataToMap(paddingMap);
}

function setupBearingMap() {
  const fit = mapFitFeatures(
    sampleData as GeoJSON.FeatureCollection,
    [600, 300],
    {
      preferredBearing: 180
    }
  );

  const bearingMap = new Map({
    container: 'map-bearing-preview',
    style: 'https://demotiles.maplibre.org/style.json',
    center: fit.center,
    bearing: fit.bearing,
    zoom: fit.zoom,
    interactive: false,
  });

  addSampleDataToMap(bearingMap);
}

function setupCodePreview() {
  document.getElementById('code-preview-library-maplibre').addEventListener('change', function() {
    const radioButton = this as HTMLInputElement;

    if (radioButton.checked) {
      document.getElementById('code-preview-maplibre').style.display = 'block';
      document.getElementById('code-preview-mapbox').style.display = 'none';
    }
  });

  document.getElementById('code-preview-library-mapbox').addEventListener('change', function() {
    const radioButton = this as HTMLInputElement;

    if (radioButton.checked) {
      document.getElementById('code-preview-mapbox').style.display = 'block';
      document.getElementById('code-preview-maplibre').style.display = 'none';
    }
  });
}

function addSampleDataToMap(map) {
  map.on('load', () => {
    map.addSource('sample-data', {
      type: 'geojson',
      data: sampleData as GeoJSON.FeatureCollection
    });

    map.addLayer({
      id: 'sample-data',
      type: 'circle',
      source: 'sample-data',
      paint: {
        'circle-radius': 4,
        'circle-color': '#FFFFFF',
        'circle-stroke-width': 1,
        'circle-stroke-color': '#000000'
      }
    });
  });
}


