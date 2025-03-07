// @ts-check

import typescript2 from 'rollup-plugin-typescript2';
import nodeResolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import css from "rollup-plugin-import-css";

/**
 * @type {import('rollup').RollupOptions}
 */
const options = {
  input: './src/main.ts',
  output: [
    {
      file: './assets/main.js',
      format: 'es'
    }
  ],
  plugins: [
    typescript2({
      clean: true,
      useTsconfigDeclarationDir: true,
      tsconfig: './tsconfig.json',
    }),
    commonjs(),
    nodeResolve({
      browser: true
    }),
    json(),
    css({
      minify: true,
      output: "css/main.css",
    }),
  ]
};

export default options;
