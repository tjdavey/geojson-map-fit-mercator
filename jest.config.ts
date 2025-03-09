import { createDefaultEsmPreset, type JestConfigWithTsJest } from 'ts-jest';

const presetConfig = createDefaultEsmPreset({});

const jestConfig: JestConfigWithTsJest = {
  ...presetConfig,
  collectCoverage: true,
  coverageReporters: ['lcov', 'text'],
};

export default jestConfig;
