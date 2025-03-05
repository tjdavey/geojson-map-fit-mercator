import { mapFitFeatures } from './';
import * as fs from 'node:fs';
import type { FeatureCollection } from 'geojson';

const fixturePoints1 = JSON.parse(fs.readFileSync('test/fixtures/points1.json', 'utf-8')) as FeatureCollection;
const fixturePoints2 = JSON.parse(fs.readFileSync('test/fixtures/points2.json', 'utf-8')) as FeatureCollection;

describe('mapFitFeatures', () => {
  it('should fit the map to a set of features', () => {
    const result = mapFitFeatures({
      features: fixturePoints1,
      screenDimensions: [800, 600],
    });

    expect(result).toEqual({
      bearing: 247.2631916432975,
      zoom: 10.289613265667661,
      center: [153.03708674911442, -27.524976579151936],
    });
  });

  it('should fit the map to a different set of features', () => {
    const result = mapFitFeatures({
      features: fixturePoints2,
      screenDimensions: [800, 600],
    });

    expect(result).toEqual({
      bearing: 233.33512569699616,
      zoom: 5.268314109632129,
      center: [148.57471973355217, -23.150148676222155],
    });
  });

  it('should fit the map to a set of features with different screen ratio', () => {
    const result = mapFitFeatures({
      features: fixturePoints1,
      screenDimensions: [400, 1200],
    });

    expect(result).toEqual({
      bearing: 157.2631916432975,
      zoom: 10.874575766388817,
      center: [153.0370867491144, -27.52497657915196],
    });
  });

  it('should fit the map to a set of features with padding', () => {
    const result = mapFitFeatures({
      features: fixturePoints1,
      screenDimensions: [800, 600],
      mapPadding: {
        left: 0,
        right: 100,
        top: 50,
        bottom: 100,
      },
    });

    expect(result).toEqual({
      bearing: 247.2631916432975,
      zoom: 10.096968187725265,
      center: [153.04187912545763, -27.461446002679352],
    });
  });
});
