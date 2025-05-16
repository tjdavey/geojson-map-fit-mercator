import { Map } from 'maplibre-gl';
import { mapFitFeatures } from '../../src/index';
import bbox from '@turf/bbox';
import type { GeoJSON } from 'geojson';
import type { LngLatBoundsLike } from 'maplibre-gl';

import sampleData from './sampledata.json' with {type: 'json'};

import 'maplibre-gl/dist/maplibre-gl.css';

window.addEventListener("load", (event) => {
  setupMapMainPreview();
  addMap('map-padding-preview', {padding: {top: 50, bottom: 50, left: 100, right: 100}});
  addMap('map-bearing-preview', {preferredBearing: 45});
  setupCodePreview();
});

function setupMapMainPreview() {
  const padding = {
    left: 10,
    right: 10,
    top: 10,
    bottom: 10
  }
  const mapId = 'map-main-preview';

  const previewMap = addMap(mapId, {padding});

  document.getElementById('map-main-preview-fit-bestFit').addEventListener('change', function() {
    const radioButton = this as HTMLInputElement;

    const bestFit = mapFitFeatures(
      sampleData as GeoJSON.FeatureCollection,
      [document.getElementById(mapId).clientWidth, document.getElementById(mapId).clientHeight],
      {maxZoom: 8, padding});

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

    const boundingBox = bbox(sampleData as GeoJSON.FeatureCollection);

    if (radioButton.checked) {
      previewMap.fitBounds(boundingBox as LngLatBoundsLike, {padding});
    }
  });

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
  const padding ={
    top: 50,
    bottom: 50,
    left: 100,
    right: 100
  }
  const mapId = 'map-padding-preview';

  const fit = mapFitFeatures(
    sampleData as GeoJSON.FeatureCollection,
    [document.getElementById(mapId).clientWidth, document.getElementById(mapId).clientHeight],
    {
      padding
    }
  );

  const paddingMap = new Map({
    container: mapId,
    style: 'https://demotiles.maplibre.org/style.json',
    center: fit.center,
    bearing: fit.bearing,
    zoom: fit.zoom,
    interactive: false,
  });

  addSampleDataToMap(paddingMap);
  setupMapResize(paddingMap, 'map-padding-preview', padding);
}

function setupBearingMap() {

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

function addMap(mapId, fitOptions) {
  const fit = mapFitFeatures(
    sampleData as GeoJSON.FeatureCollection,
    [document.getElementById(mapId).clientWidth, document.getElementById(mapId).clientHeight],
    fitOptions
  );

  const map = new Map({
    container: mapId,
    style: 'https://demotiles.maplibre.org/style.json',
    center: fit.center,
    bearing: fit.bearing,
    zoom: fit.zoom,
    interactive: false,
  });

  addSampleDataToMap(map);
  setupMapResize(map, mapId, fitOptions.padding || {});

  return map;
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

function setupMapResize(map, id, padding) {
  window.addEventListener('resize', () => {
    if(window.innerWidth < 720) {
      // Window is small enough to begin impacting the width of the maps. Recalculate the map size to fit the new window size.
      const fit = mapFitFeatures(
        sampleData as GeoJSON.FeatureCollection,
        [document.getElementById(id).clientWidth, document.getElementById(id).clientHeight],
        {maxZoom: 8, padding});

      map.easeTo(fit);
    }

  });
}


