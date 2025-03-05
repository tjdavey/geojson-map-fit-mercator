import { createDefaultEsmPreset, type JestConfigWithTsJest } from 'ts-jest';

const presetConfig = createDefaultEsmPreset({});

const jestConfig: JestConfigWithTsJest = {
  ...presetConfig,
  collectCoverage: true,
};

export default jestConfig;
