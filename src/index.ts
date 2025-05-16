import { SphericalMercator } from '@mapbox/sphericalmercator';
import { bearing } from '@turf/bearing';
import { convex } from '@turf/convex';
import { getCoords } from '@turf/invariant';
import type { Polygon, Feature, FeatureCollection, LineString } from 'geojson';
import { findScreenCenter, findScreenBearing, findScreenZoom } from './screen';
import { XY, mapFitPadding, mapFitOptions, mapFitResult, rectangleOrientation, boundingOrientation } from './types';
import transformRotate from '@turf/transform-rotate';
import centroid from '@turf/centroid';
import { segmentReduce } from '@turf/meta';
import polygonToLine from '@turf/polygon-to-line';
import envelope from '@turf/envelope';
import { length } from '@turf/length';
import type { AllGeoJSON } from '@turf/helpers';

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

export function minimumBoundingRectangle(geoJsonInput: AllGeoJSON): {
  boundsOrientation: boundingOrientation;
  boundingRectangle: Feature<Polygon>;
} {
  // Create a convex hull around the input geometry
  const convexHull = convex(geoJsonInput);
  if (!convexHull) throw new Error("Can't determine minimumBoundingRectangle for given geometry");

  // Break the hull into its constituent edges and find the smallest
  const hullLines = polygonToLine(convexHull);
  const smallestHullBoundsOrientation = segmentReduce(
    hullLines,
    (smallestEnvelope: boundingOrientation | undefined, segment) => {
      return smallestHullEnvelopeReducer(smallestEnvelope, segment!, convexHull);
    },
    { bearing: undefined, orientation: { shortSide: undefined, longSide: undefined }, envelope: undefined },
  );

  const boundingRectangle = transformRotate(
    envelope(smallestHullBoundsOrientation.envelope!),
    smallestHullBoundsOrientation.bearing!,
    {
      pivot: centroid(convexHull),
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
  const segmentCoords = getCoords(segment);
  const segmentBearing = bearing(segmentCoords[0], segmentCoords[1]);

  const rotatedHull = transformRotate(hull, -1.0 * segmentBearing, {
    pivot: centroid(hull),
  });
  const envelopeOfHull = envelope(rotatedHull);

  const rectangleOrientation = findRectangleOrientation(envelopeOfHull);
  const shortSideLength = length(rectangleOrientation.shortSide!);

  if (
    smallestEnvelope!.orientation.shortSide == undefined ||
    shortSideLength < length(smallestEnvelope!.orientation.shortSide)
  ) {
    return { bearing: segmentBearing, orientation: rectangleOrientation, envelope: envelopeOfHull };
  }

  return smallestEnvelope!;
}

function findRectangleOrientation(rectangle: Feature<Polygon>): rectangleOrientation {
  const rectangleSides = polygonToLine(rectangle);
  return segmentReduce(
    rectangleSides,
    (sideOrientation: rectangleOrientation | undefined, segment): rectangleOrientation => {
      const segmentLength = length(segment!);

      if (sideOrientation!.shortSide == undefined || length(sideOrientation!.shortSide) > segmentLength) {
        sideOrientation!.shortSide = segment!;
      }

      if (sideOrientation!.longSide == undefined || length(sideOrientation!.longSide) < segmentLength) {
        sideOrientation!.longSide = segment!;
      }

      return sideOrientation!;
    },
    { shortSide: undefined, longSide: undefined },
  );
}

export { mapFitFeatures };
