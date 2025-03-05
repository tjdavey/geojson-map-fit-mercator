import type { FeatureCollection, Position } from 'geojson';
interface mapFitOptions {
    tileSize?: number;
    antimeridian?: boolean;
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
    center: Position;
}
type XY = [number, number];
declare function mapFitFeatures({ features, screenDimensions, mapPadding, maxZoom, options, }: {
    features: FeatureCollection;
    screenDimensions: XY;
    mapPadding?: mapFitPadding;
    maxZoom?: number;
    options?: mapFitOptions;
}): mapFitResult;
export { mapFitFeatures };
//# sourceMappingURL=index.d.ts.map