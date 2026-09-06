# Changelog

## 1.1.1 - 2026-09-06
### Fixes
- CommonJS distributions now correctly resolve `@turf/*` dependencies

### Updates
- `@turf/*` dependencies updated to minimum 7.4.0
- `@mapbox/sphericalmercator` now requires minimum 2.0.2

## 1.1.0 - 2025-05-16

### Changes
- Removes `@turf/turf` and substitutes individual component libraries to remove two of its component libraries, @turf/isolines and @turf/isobands which contains a dependency licensed under the AGPL 3.0. All Turf dependencies are now MIT only components.
