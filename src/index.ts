import { SphericalMercator } from '@mapbox/sphericalmercator';
import * as turf from '@turf/turf';
import type { Polygon, Feature, FeatureCollection, LineString } from 'geojson';
import { findScreenCenter, findScreenBearing, findScreenZoom} from './screen';
import { XY, mapFitPadding, mapFitOptions, mapFitResult, rectangleOrientation, boundingOrientation } from './types';

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
