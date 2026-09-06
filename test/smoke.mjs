/**
 * Smoke test for the built bundles in ./dist.
 *
 * The Jest suite runs against the TypeScript sources, so it cannot catch
 * packaging faults such as a broken CommonJS interop. This exercises the
 * published entry points exactly as a consumer would.
 *
 * Run with `npm run test:dist` after `npm run build`.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

const features = JSON.parse(fs.readFileSync(path.join(here, 'fixtures/points1.json'), 'utf-8'));
const expected = {
  bearing: 67.26319164329749,
  zoom: 10.28961353474488,
  center: [153.0370867491144, -27.525132573088545],
};

const cjs = require(path.join(here, '../dist/index.cjs'));
assert.deepEqual(cjs.mapFitFeatures(features, [800, 600]), expected, 'dist/index.cjs returned an unexpected result');
console.log('✓ dist/index.cjs');

const mjs = await import(path.join(here, '../dist/index.mjs'));
assert.deepEqual(mjs.mapFitFeatures(features, [800, 600]), expected, 'dist/index.mjs returned an unexpected result');
console.log('✓ dist/index.mjs');

console.log('Bundle smoke test passed.');
