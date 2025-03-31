import type { Feature, LineString, Polygon } from 'geojson';

export type XY = [number, number];
export type LngLat = [number, number];

export interface mapFitOptions {
  tileSize?: number;
  preferredBearing?: number;
  maxZoom?: number;
  floatZoom?: boolean;
  padding?: mapFitPadding;
}

export interface mapFitPadding {
  left?: number;
  right?: number;
  top?: number;
  bottom?: number;
}

export interface mapFitResult {
  bearing: number;
  zoom: number;
  center: LngLat;
}

export interface rectangleOrientation {
  shortSide: Feature<LineString> | undefined;
  longSide: Feature<LineString> | undefined;
}

export interface boundingOrientation {
  bearing: number | undefined;
  orientation: rectangleOrientation;
  envelope: Feature<Polygon> | undefined;
}
