// @ts-check

/* global module -- Global defined by Node.js */

/**
 * An object with Jest options.
 * @type {import('ts-jest').JestConfigWithTsJest}
 */
const options = {
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        isolatedModules: true,
        useESM: true,
      },
    ],
  },
  resolver: 'ts-jest-resolver',
};

module.exports = options;
