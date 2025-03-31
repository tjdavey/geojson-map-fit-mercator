import { findScreenBearing } from './screen';

describe('findScreenBearing', () => {
  it('should return the north-oriented bearing of the long side of the bounding rectangle if the screen is portrait', () => {
    const result = findScreenBearing(23.564, 0, 0.5);

    expect(result).toEqual(23.564);
  });

  it('should return the west-oriented bearing of the most long side of the bounding rectangle if the screen is portrait and preferredBearing 270 is given', () => {
    const result = findScreenBearing(23.564,270, 0.5);

    expect(result).toEqual(203.564);
  });

  it('should return the bearing 90 off the most north-oriented long side of the bounding rectangle if the screen is landscape', () => {
    const result = findScreenBearing(23.564, 0, 1.2);

    expect(result).toEqual(293.56399999999996);
  });

  it('should return the south-oriented bearing of the most long side of the bounding rectangle if the screen is landscape and preferredBearing 180 is given', () => {
    const result = findScreenBearing(23.564,  180,  1.2);

    expect(result).toEqual(113.564);
  });
});
