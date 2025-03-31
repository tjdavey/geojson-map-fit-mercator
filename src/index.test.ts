import { mapFitFeatures } from './';
import * as fs from 'node:fs';
import type { FeatureCollection } from 'geojson';

const fixturePoints1 = JSON.parse(fs.readFileSync('test/fixtures/points1.json', 'utf-8')) as FeatureCollection;
const fixturePoints2 = JSON.parse(fs.readFileSync('test/fixtures/points2.json', 'utf-8')) as FeatureCollection;

describe('mapFitFeatures', () => {
  it('should fit the map to a set of features', () => {
    const result = mapFitFeatures(fixturePoints1, [800, 600]);

    expect(result).toEqual({
      bearing: 67.26319164329749,
      zoom: 10.28961353474488,
      center: [153.0370867491144, -27.525132573088545],
    });
  });

  it('should fit the map to a different set of features', () => {
    const result = mapFitFeatures(fixturePoints2, [800, 600]);

    expect(result).toEqual({
      bearing: 53.33512569699616,
      zoom: 5.268314076490395,
      center: [148.57471973355217, -23.25823876839225],
    });
  });

  it('should fit the map to a set of features with different screen ratio', () => {
    const result = mapFitFeatures(fixturePoints1, [400, 1200]);

    expect(result).toEqual({
      bearing: 337.2631916432975,
      zoom: 10.874576035466035,
      center: [153.0370867491144, -27.52513257308853],
    });
  });

  it('should fit the map to a set of features with padding', () => {
    const result = mapFitFeatures(fixturePoints1, [800, 600], {
      padding: {
        left: 0,
        right: 100,
        top: 50,
        bottom: 100,
      },
    });

    expect(result).toEqual({
      bearing: 67.26319164329749,
      zoom: 10.096968456802484,
      center: [153.03229437366502, -27.588626358968774],
    });
  });

  it('should fit the map to a set of features with a preferred bearing', () => {
    // This ficture set produces a bearing of 67.26319164329749, but if we set a preferred bearing of 210, it should be 247.2631916432975
    const result = mapFitFeatures(fixturePoints1, [800, 600], {
      preferredBearing: 210,
    });

    expect(result).toEqual({
      bearing: 247.2631916432975,
      zoom: 10.28961353474488,
      center: [153.0370867491144, -27.525132573088545],
    });
  });
});


