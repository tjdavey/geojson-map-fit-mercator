import { SphericalMercator } from '@mapbox/sphericalmercator';
import * as turf from '@turf/turf';
import type { Polygon, Feature, FeatureCollection, Position, LineString } from 'geojson';

type XY = [number, number];
type LngLat = [number, number];

interface mapFitOptions {
  tileSize?: number;
  preferredBearing?: number;
  maxZoom?: number;
  floatZoom?: boolean;
  padding?: mapFitPadding;
}

interface mapFitPadding {
  left?: number;
  right?: number;
  top?: number;
  bottom?: number;
}

interface mapFitResult {
  bearing: number;
  zoom: number;
  center: LngLat;
}

interface rectangleOrientation {
  shortSide: Feature<LineString> | undefined;
  longSide: Feature<LineString> | undefined;
}

interface boundingOrientation {
  bearing: number | undefined;
  orientation: rectangleOrientation;
  envelope: Feature<Polygon> | undefined;
}

function mapFitFeatures(
  features: FeatureCollection,
  screenDimensions: XY,
  options: mapFitOptions = {} as mapFitOptions,
): mapFitResult {
  // Set default options
  const {
    tileSize = 512,
    preferredBearing = 0,
    padding = {} as mapFitPadding,
    maxZoom = 23,
    floatZoom = true,
  } = options;

  // Create a mercator projection. SphericalMercator caches its calculations so it's safe to create a new instance each run
  const merc: SphericalMercator = new SphericalMercator({ size: tileSize, antimeridian: true });
  const [screenWidth, screenHeight] = screenDimensions;
  const { left = 0, right = 0, top = 0, bottom = 0 } = padding;
  const paddedScreenWidth = screenWidth - left - right;
  const paddedScreenHeight = screenHeight - top - bottom;
  const paddedScreenRatio = paddedScreenWidth / paddedScreenHeight;

  // Calculate the bounding rectangle of the features
  const {
    boundsOrientation: { orientation, bearing: baseBearing },
    boundingRectangle,
  } = minimumBoundingRectangle(features);

  if (!boundingRectangle) {
    throw new Error('Unable to calculate bounding rectangle');
  }

  // Determine how to fit the bounding rectangle to the screen
  const zoom = findScreenZoom(
    [paddedScreenWidth, paddedScreenHeight],
    paddedScreenRatio,
    orientation,
    maxZoom,
    floatZoom,
    merc,
  );
  const bearing = findScreenBearing(baseBearing!, preferredBearing, paddedScreenRatio);
  const center = findScreenCenter(boundingRectangle, bearing, zoom, padding, merc);

  return { bearing, zoom, center };
}

function findScreenZoom(
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

function findScreenBearing(boundingRectangleBearing: number, preferredBearing: number, screenRatio: number): number {
  let bearing = boundingRectangleBearing;
  // Rotate the bearing by 90 degrees if the screen is wider than it is tall
  if (screenRatio > 1) {
    bearing = bearing + (90 % 360);
  }

  // Rotate the bearing 180 degrees if the preferred bearing is on the opposite side of the screen
  if (bearing < preferredBearing - (90 % 360) || bearing > preferredBearing + (90 % 360)) {
    bearing = (bearing + 180) % 360;
  }

  return bearing;
}

function findScreenCenter(
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

export function minimumBoundingRectangle(geoJsonInput: turf.AllGeoJSON): {
  boundsOrientation: boundingOrientation;
  boundingRectangle: Feature<Polygon>;
} {
  // Create a convex hull around the input geometry
  const convexHull = turf.convex(geoJsonInput);
  if (!convexHull) throw new Error("Can't determine minimumBoundingRectangle for given geometry");

  // Break the hull into its constituent edges and find the smallest
  const hullLines = turf.polygonToLine(convexHull);
  const smallestHullBoundsOrientation = turf.segmentReduce(
    hullLines,
    (smallestEnvelope: boundingOrientation | undefined, segment) => {
      return smallestHullEnvelopeReducer(smallestEnvelope, segment!, convexHull);
    },
    { bearing: undefined, orientation: { shortSide: undefined, longSide: undefined }, envelope: undefined },
  );

  const boundingRectangle = turf.transformRotate(
    turf.envelope(smallestHullBoundsOrientation.envelope!),
    smallestHullBoundsOrientation.bearing!,
    {
      pivot: turf.centroid(convexHull),
    },
  );

  return {
    boundsOrientation: smallestHullBoundsOrientation,
    boundingRectangle,
  };
}

function smallestHullEnvelopeReducer(
  smallestEnvelope: boundingOrientation | undefined,
  segment: Feature<LineString>,
  hull: Feature<Polygon>,
): boundingOrientation {
  const segmentCoords = turf.getCoords(segment);
  const bearing = turf.bearing(segmentCoords[0], segmentCoords[1]);

  const rotatedHull = turf.transformRotate(hull, -1.0 * bearing, {
    pivot: turf.centroid(hull),
  });
  const envelopeOfHull = turf.envelope(rotatedHull);

  const rectangleOrientation = findRectangleOrientation(envelopeOfHull);
  const shortSideLength = turf.length(rectangleOrientation.shortSide!);

  if (
    smallestEnvelope!.orientation.shortSide == undefined ||
    shortSideLength < turf.length(smallestEnvelope!.orientation.shortSide)
  ) {
    return { bearing, orientation: rectangleOrientation, envelope: envelopeOfHull };
  }

  return smallestEnvelope!;
}

function findRectangleOrientation(rectangle: Feature<Polygon>): rectangleOrientation {
  const rectangleSides = turf.polygonToLine(rectangle);
  return turf.segmentReduce(
    rectangleSides,
    (sideOrientation: rectangleOrientation | undefined, segment): rectangleOrientation => {
      const segmentLength = turf.length(segment!);

      if (sideOrientation!.shortSide == undefined || turf.length(sideOrientation!.shortSide) > segmentLength) {
        sideOrientation!.shortSide = segment!;
      }

      if (sideOrientation!.longSide == undefined || turf.length(sideOrientation!.longSide) < segmentLength) {
        sideOrientation!.longSide = segment!;
      }

      return sideOrientation!;
    },
    { shortSide: undefined, longSide: undefined },
  );
}

export { mapFitFeatures };
