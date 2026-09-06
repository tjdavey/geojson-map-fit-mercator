// @ts-check

import terser from '@rollup/plugin-terser';
import typescript2 from 'rollup-plugin-typescript2';
import packageJSON from './package.json' with { type: 'json' };

/**
 * Comment with library information to be appended in the generated bundles.
 */
const banner = `/*!
 * ${packageJSON.name} v${packageJSON.version}
 * (c) ${packageJSON.author.name}
 * Released under the ${packageJSON.license} License.
 */
`;

/**
 * Creates an output options object for Rollup.js.
 * @param {import('rollup').OutputOptions} options
 * @returns {import('rollup').OutputOptions}
 */
function createOutputOptions(options) {
  return {
    banner,
    name: '[libraryCamelCaseName]',
    exports: 'named',
    sourcemap: true,
    ...options,
  };
}

/**
 * Runtime dependencies must not be bundled: consumers install them from the
 * package's own `dependencies`. Declaring them keeps Rollup from falling back
 * to its unresolved-module behaviour, which assumes `module.exports` is the
 * default export and breaks the CommonJS build for packages that export an
 * ES module shape.
 * @param {string} id
 * @returns {boolean}
 */
function isExternal(id) {
  return Object.keys(packageJSON.dependencies).some((dep) => id === dep || id.startsWith(`${dep}/`));
}

/**
 * @type {import('rollup').RollupOptions}
 */
const options = {
  input: './src/index.ts',
  output: [
    createOutputOptions({
      file: './dist/index.cjs',
      format: 'commonjs',
    }),
    createOutputOptions({
      file: './dist/index.mjs',
      format: 'esm',
    })
  ],
  plugins: [
    typescript2({
      clean: true,
      useTsconfigDeclarationDir: true,
      tsconfig: './tsconfig.bundle.json',
    }),
  ],
  external: isExternal,
};

export default options;
