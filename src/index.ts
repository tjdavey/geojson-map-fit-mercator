import { smallestSurroundingRectangleByWidth } from 'geojson-minimum-bounding-rectangle';
import { SphericalMercator } from '@mapbox/sphericalmercator';
import * as turf from '@turf/turf';
import type { Lines } from '@turf/helpers';
import type {
  Feature,
  FeatureCollection,
  Position,
  GeoJsonProperties,
  GeometryCollection,
  Geometry,
  LineString,
  MultiLineString,
} from 'geojson';

interface fitMapOptions {
  tileSize?: number;
  antimeridian?: boolean;
}

interface fitMapPadding {
  left?: number;
  right?: number;
  top?: number;
  bottom?: number;
}

interface fitMapResult {
  bearing: number;
  zoom: number;
  center: Position;
}

type XY = [number, number];
type LonLat = [number, number];

function fitMapFeatures({
  features,
  screenDimensions,
  mapPadding = {} as fitMapPadding,
  maxZoom = 20,
  options = {} as fitMapOptions,
}: {
  features: FeatureCollection;
  screenDimensions: XY;
  mapPadding?: fitMapPadding;
  maxZoom?: number;
  options?: fitMapOptions;
}): fitMapResult {
  const { tileSize = 512, antimeridian = true } = options;

  const merc: SphericalMercator = new SphericalMercator({
    size: tileSize,
    antimeridian: antimeridian,
  });
  const surroundingRectangle = smallestSurroundingRectangleByWidth(features);
  if (!surroundingRectangle) {
    throw new Error('Unable to calculate surrounding rectangle');
  }

  const longestLine = findLine(surroundingRectangle!, (a, b) => turf.length(a) > turf.length(b));
  const shortestLine = findLine(surroundingRectangle!, (a, b) => turf.length(a) < turf.length(b));

  if (!longestLine || !shortestLine) {
    throw new Error('Unable to orient surrounding rectangle');
  }

  // Use the longest side of the polygon to calculate the base bearing
  let bearing = 0;

  const longestLineCoords = turf.getCoords(longestLine);
  const shortestLineCoords = turf.getCoords(shortestLine);

  // We need to determine the ratio required for the zoom level. To do this we are going to approximate the length
  // of the longest and shortest sides of the polygon in pixels (This doesn't account for projection distortion but is
  // a good estimation)
  const longPx: [XY, XY] = [merc.px(longestLineCoords[0], maxZoom), merc.px(longestLineCoords[1], maxZoom)];
  const shortPx: [XY, XY] = [merc.px(shortestLineCoords[0], maxZoom), merc.px(shortestLineCoords[1], maxZoom)];

  // Because these points aren't aligned to the axis, we use the Pythagorean theorem to calculate the distance
  const longPxX = longPx[0][0] - longPx[1][0];
  const longPxY = longPx[0][1] - longPx[1][1];
  const shortPxX = shortPx[0][0] - shortPx[1][0];
  const shortPxY = shortPx[0][1] - shortPx[1][1];
  const longPxDistance = Math.sqrt(Math.pow(longPxX, 2) + Math.pow(longPxY, 2));
  const shortPxDistance = Math.sqrt(Math.pow(shortPxX, 2) + Math.pow(shortPxY, 2));

  let xPx = 0;
  let yPx = 0;

  // Use screenDimensions to calculate widest screen dimension, use widest polygon edge to calculate base bearing
  const [screenWidth, screenHeight] = screenDimensions;
  const { left = 0, right = 0, top = 0, bottom = 0 } = mapPadding;
  const xPadding = left + right;
  const yPadding = top + bottom;

  // If the screen is wider than it is tall, rotate the bearing by 90 degrees
  if (screenWidth + xPadding > screenHeight + yPadding) {
    bearing = turf.bearing(shortestLineCoords[0], shortestLineCoords[1]);
    xPx = longPxDistance;
    yPx = shortPxDistance;
  } else {
    bearing = turf.bearing(longestLineCoords[0], longestLineCoords[1]);
    xPx = shortPxDistance;
    yPx = longPxDistance;
  }

  const ratios: XY = [Math.abs(xPx / (screenWidth - xPadding)), Math.abs(yPx / (screenHeight - yPadding))];
  const zoom = getOptimalZoom(maxZoom, ratios);

  const centroid = turf.centroid(surroundingRectangle);
  if (!centroid) {
    throw new Error('Unable to calculate centre of surrounding rectangle');
  }
  const center = turf.getCoord(centroid)!;
  if (!isLonLat(center)) {
    throw new Error('Unable to calculate centre of surrounding rectangle');
  }

  const centerPx = merc.px(center, zoom);

  if (bearing < 0) {
    bearing = 360 + bearing;
  }

  // Calculate the offset required to center the polygon in the viewport
  const xPaddingOffset = right - left;
  const yPaddingOffset = bottom - top;

  if (xPaddingOffset != 0 || yPaddingOffset != 0) {
    const bearingRadians = bearing * (Math.PI / 180);

    const centerXOffset = xPaddingOffset * Math.cos(bearingRadians) - yPaddingOffset * Math.sin(bearingRadians);
    const centerYOffset = xPaddingOffset * Math.sin(bearingRadians) + yPaddingOffset * Math.cos(bearingRadians);

    return {
      bearing,
      zoom,
      center: merc.ll([centerPx[0] + centerXOffset, centerPx[1] + centerYOffset], zoom),
    };
  } else {
    return { bearing, zoom, center: merc.ll(centerPx, zoom) };
  }
}

function findLine(
  polygon: Feature<Lines, GeoJsonProperties> | Feature<GeometryCollection<Geometry>, GeoJsonProperties>,
  compareFn: (
    a: FeatureCollection | Feature | GeometryCollection,
    b: FeatureCollection | Feature | GeometryCollection,
  ) => boolean,
): Feature<LineString | MultiLineString> {
  return turf.segmentReduce(polygon, (longestSegment, segment) => {
    if (!longestSegment) {
      return segment!;
    }

    if (compareFn(segment!, longestSegment!)) {
      return segment!;
    }

    return longestSegment!;
  });
}

function isLonLat(lonLat: Position): lonLat is LonLat {
  return lonLat.length === 2 && lonLat.every((coord) => typeof coord === 'number');
}

function getOptimalZoom(baseZoom: number, ratios: [number, number]) {
  return Math.min(baseZoom - Math.log(ratios[0]) / Math.log(2), baseZoom - Math.log(ratios[1]) / Math.log(2));
}

export { fitMapFeatures };
