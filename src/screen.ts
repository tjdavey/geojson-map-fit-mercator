import * as turf from '@turf/turf';
import type { Feature, Polygon, Position } from 'geojson';
import { SphericalMercator } from '@mapbox/sphericalmercator';
import { XY, LngLat, mapFitPadding, rectangleOrientation } from './types';

export function findScreenZoom(
  paddedScreenDimensions: XY,
  paddedScreenRatio: number,
  boundingRectangleOrientation: rectangleOrientation,
  maxZoom: number,
  floatZoom: boolean,
  merc: SphericalMercator,
): number {
  const { shortSide, longSide } = boundingRectangleOrientation;
  const longSideCoords = turf.getCoords(longSide!);
  const shortSideCoords = turf.getCoords(shortSide!);

  // We need to determine the ratio required for the zoom level. To do this we are going to approximate the length
  // of the longest and shortest sides of the polygon in pixels (This doesn't account for projection distortion but is
  // a good estimation)
  const longPx: [XY, XY] = [merc.px(longSideCoords[0], maxZoom), merc.px(longSideCoords[1], maxZoom)];
  const shortPx: [XY, XY] = [merc.px(shortSideCoords[0], maxZoom), merc.px(shortSideCoords[1], maxZoom)];

  // Because these points aren't aligned to the axis, we use the Pythagorean theorem to calculate the distance
  const longPxX = longPx[0][0] - longPx[1][0];
  const longPxY = longPx[0][1] - longPx[1][1];
  const shortPxX = shortPx[0][0] - shortPx[1][0];
  const shortPxY = shortPx[0][1] - shortPx[1][1];
  const longPxDistance = Math.sqrt(Math.pow(longPxX, 2) + Math.pow(longPxY, 2));
  const shortPxDistance = Math.sqrt(Math.pow(shortPxX, 2) + Math.pow(shortPxY, 2));

  let xPx = longPxDistance;
  let yPx = shortPxDistance;

  // If the screen is taller than it is wide, swap the x and y values
  if (paddedScreenRatio < 1) {
    xPx = shortPxDistance;
    yPx = longPxDistance;
  }

  const ratios: XY = [Math.abs(xPx / paddedScreenDimensions[0]), Math.abs(yPx / paddedScreenDimensions[1])];
  const zoom = Math.min(maxZoom - Math.log(ratios[0]) / Math.log(2), maxZoom - Math.log(ratios[1]) / Math.log(2));
  return floatZoom ? zoom : Math.floor(zoom);
}

export function findScreenBearing(boundingRectangleBearing: number, preferredBearing: number, screenRatio: number): number {
  let bearing = boundingRectangleBearing;
  // Rotate the bearing by 90 degrees if the screen is wider than it is tall
  if (screenRatio > 1) {
    bearing = bearing + (90 % 360);
  }

  // Rotate the bearing 180 degrees if the preferred bearing is on the opposite side of the screen
  if (bearing < (preferredBearing - 90) % 360 || bearing > (preferredBearing + 90) % 360) {
    bearing = (bearing + 180) % 360;
  }

  return bearing;
}

export function findScreenCenter(
  boundingRectangle: Feature<Polygon>,
  bearing: number,
  zoom: number,
  padding: mapFitPadding,
  merc: SphericalMercator,
) {
  const { left = 0, right = 0, top = 0, bottom = 0 } = padding;

  // Use the bounding rectangle's pixel location to calculate the centre of the
  // map. This allows us to account for mercator projection distortion.
  const coords = turf.getCoords(boundingRectangle);
  const uniqCoords = coords[0].reduce((uniq: Position[], coord: [number, number]) => {
    if (!uniq.find((c) => c[0] === coord[0] && c[1] === coord[1])) {
      uniq.push(coord);
    }
    return uniq;
  }, []);

  const sumCoords = uniqCoords.reduce(
    (acc: [number, number], coord: [number, number]) => {
      const [x, y] = merc.px(coord as LngLat, zoom);
      acc[0] = acc[0] + x;
      acc[1] = acc[1] + y;
      return acc;
    },
    [0, 0],
  );

  const midX = sumCoords[0] / uniqCoords.length;
  const midY = sumCoords[1] / uniqCoords.length;

  const xPaddingOffset = right - left;
  const yPaddingOffset = bottom - top;

  const bearingRadians = bearing * (Math.PI / 180);

  const centerXOffset = xPaddingOffset * Math.cos(bearingRadians) - yPaddingOffset * Math.sin(bearingRadians);
  const centerYOffset = xPaddingOffset * Math.sin(bearingRadians) + yPaddingOffset * Math.cos(bearingRadians);

  return merc.ll([midX + centerXOffset, midY + centerYOffset], zoom);
}
