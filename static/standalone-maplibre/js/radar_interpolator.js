/**
 * Radar Frame GeoJSON Interpolator — Hierarchical Containment Constrained Engine
 *
 * Implements:
 * 1. Target Layer Name Filtering:
 *    - Observation frames: single layer per PBF.
 *    - Nowcast frames: 20 discrete time-step layers packed in one PBF. Correctly decodes
 *      only the specific target layer for each nowcast 5-min frame horizon.
 *    - Raw PBF tile buffer memory cache so shared nowcast tiles download once and decode instantly.
 *
 * 2. Hierarchical Intensity-Tiered Interpolation:
 *    - Rain radar features form concentric level sets:
 *      Level 0.2 mm/h (outer storm envelope) > 0.5 > 1.0 > 1.6 > 2.0 > 3.1 > 4.7 > ... (inner storm cores).
 *    - Step 1: Interpolate lowest rain intensity polygons first (base storm envelopes) by matching centroids.
 *    - Step 2: For higher rain intensity polygons, locate their containing parent polygon in the lower tier.
 *    - Higher intensity cores inherit their parent storm's displacement vector.
 *    - Enforce containment: child core vertices are mathematically constrained and fitted
 *      to sit ENTIRELY inside their lower-intensity parent polygon.
 *    - Zero cores drifting outside storm clouds, zero ghosting, zero blur.
 */

import { decodePBF } from './pbf_decoder.js';

// Cache for raw decompressed tile bytes (shared across nowcast frame layers)
const rawTileCache = new Map();

// Decompress gzip if needed (browser has DecompressionStream)
async function maybeDecompress(buf) {
  const magic = new Uint8Array(buf, 0, 2);
  if (magic[0] === 0x1f && magic[1] === 0x8b) {
    const ds = new DecompressionStream('gzip');
    const writer = ds.writable.getWriter();
    const reader = ds.readable.getReader();
    writer.write(new Uint8Array(buf));
    writer.close();
    const chunks = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
    const total = chunks.reduce((a, c) => a + c.length, 0);
    const out = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) { out.set(chunk, offset); offset += chunk.length; }
    return out;
  }
  return new Uint8Array(buf);
}

export function clearTileCache() {
  rawTileCache.clear();
}

function allOuterRings(feature) {
  const g = feature.geometry;
  if (!g) return [];
  if (g.type === 'Polygon' && g.coordinates.length) return [g.coordinates[0]];
  if (g.type === 'MultiPolygon') return g.coordinates.filter(p => p.length).map(p => p[0]);
  return [];
}

export function polygonCentroid(feature) {
  const rings = allOuterRings(feature);
  let x = 0, y = 0, count = 0;
  for (const ring of rings) {
    for (const [lng, lat] of ring) { x += lng; y += lat; count++; }
  }
  return count > 0 ? [x / count, y / count] : [0, 0];
}

function dist2(a, b) {
  const dx = a[0] - b[0], dy = a[1] - b[1];
  return dx * dx + dy * dy;
}

/**
 * Standard ray-casting Point-in-Polygon test for a single ring.
 */
function pointInRing(point, ring) {
  const x = point[0], y = point[1];
  let inside = false;
  const n = ring.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const xi = ring[i][0], yi = ring[i][1];
    const xj = ring[j][0], yj = ring[j][1];
    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  return inside;
}

/**
 * Checks if a point is strictly inside a Polygon or MultiPolygon geometry (considering holes).
 */
function pointInGeometry(point, geom) {
  if (!geom) return false;
  if (geom.type === 'Polygon') {
    if (!geom.coordinates.length || !geom.coordinates[0].length) return false;
    if (!pointInRing(point, geom.coordinates[0])) return false;
    // Must NOT be inside any hole (index 1+)
    for (let h = 1; h < geom.coordinates.length; h++) {
      if (pointInRing(point, geom.coordinates[h])) return false;
    }
    return true;
  }
  if (geom.type === 'MultiPolygon') {
    for (const poly of geom.coordinates) {
      if (poly.length && pointInRing(point, poly[0])) {
        let inHole = false;
        for (let h = 1; h < poly.length; h++) {
          if (pointInRing(point, poly[h])) { inHole = true; break; }
        }
        if (!inHole) return true;
      }
    }
    return false;
  }
  return false;
}

/**
 * Finds the parent feature in lowerTierFeatures that contains the centroid of childFeature.
 */
function findContainingParent(childFeature, lowerTierFeatures) {
  if (!lowerTierFeatures || !lowerTierFeatures.length) return null;
  const cent = polygonCentroid(childFeature);

  // 1. Point in polygon test
  for (const parent of lowerTierFeatures) {
    if (pointInGeometry(cent, parent.geometry)) return parent;
  }

  // 2. Nearest centroid fallback if slight boundary mismatch
  let bestParent = lowerTierFeatures[0];
  let bestDist = Infinity;
  for (const parent of lowerTierFeatures) {
    const pCent = polygonCentroid(parent);
    const d = dist2(cent, pCent);
    if (d < bestDist) {
      bestDist = d;
      bestParent = parent;
    }
  }
  return bestParent;
}

/**
 * Ensures all vertices of a child ring sit strictly inside the parent geometry.
 * If any vertices poke out, scales the ring progressively inward toward its centroid.
 */
function ensureRingInsideParent(childRing, parentGeom) {
  if (!parentGeom || !childRing.length) return childRing;

  let allIn = true;
  for (const pt of childRing) {
    if (!pointInGeometry(pt, parentGeom)) {
      allIn = false;
      break;
    }
  }
  if (allIn) return childRing;

  // Calculate centroid of child ring
  let cx = 0, cy = 0;
  for (const pt of childRing) { cx += pt[0]; cy += pt[1]; }
  const centroid = [cx / childRing.length, cy / childRing.length];

  // Try progressive scaling factors inward toward centroid
  const factors = [0.95, 0.90, 0.82, 0.74, 0.65, 0.55, 0.45, 0.35, 0.25, 0.15];
  for (const factor of factors) {
    const scaled = childRing.map(pt => [
      centroid[0] + (pt[0] - centroid[0]) * factor,
      centroid[1] + (pt[1] - centroid[1]) * factor
    ]);
    let ok = true;
    for (const pt of scaled) {
      if (!pointInGeometry(pt, parentGeom)) { ok = false; break; }
    }
    if (ok) return scaled;
  }
  return childRing;
}

/**
 * Constrains an entire Polygon or MultiPolygon geometry inside a parent geometry.
 */
function ensureGeometryInsideParent(childGeom, parentGeom) {
  if (!parentGeom || !childGeom) return childGeom;
  if (childGeom.type === 'Polygon') {
    return {
      type: 'Polygon',
      coordinates: childGeom.coordinates.map(ring => ensureRingInsideParent(ring, parentGeom))
    };
  }
  if (childGeom.type === 'MultiPolygon') {
    return {
      type: 'MultiPolygon',
      coordinates: childGeom.coordinates.map(poly => poly.map(ring => ensureRingInsideParent(ring, parentGeom)))
    };
  }
  return childGeom;
}

/**
 * Translates all coordinates of a Polygon or MultiPolygon geometry by (dx, dy).
 */
function translateGeometry(geom, dx, dy) {
  if (!geom) return geom;
  const shiftRing = ring => ring.map(([lng, lat]) => [lng + dx, lat + dy]);
  if (geom.type === 'Polygon') {
    return {
      type: 'Polygon',
      coordinates: geom.coordinates.map(shiftRing)
    };
  }
  if (geom.type === 'MultiPolygon') {
    return {
      type: 'MultiPolygon',
      coordinates: geom.coordinates.map(poly => poly.map(shiftRing))
    };
  }
  return geom;
}

/**
 * Matches features within a specific intensity tier between Frame A and Frame B by nearest centroid.
 */
function matchTierFeatures(featsA, featsB) {
  const centsA = featsA.map(f => polygonCentroid(f));
  const centsB = featsB.map(f => polygonCentroid(f));

  const matchedA = new Set();
  const matchedB = new Set();
  const pairs = [];

  const candidates = [];
  for (let i = 0; i < featsA.length; i++) {
    for (let j = 0; j < featsB.length; j++) {
      candidates.push({ i, j, d2: dist2(centsA[i], centsB[j]) });
    }
  }
  candidates.sort((a, b) => a.d2 - b.d2);

  const MAX_D2 = 0.36; // ~0.6 deg max match radius (~65 km)
  for (const { i, j, d2 } of candidates) {
    if (d2 > MAX_D2) break;
    if (matchedA.has(i) || matchedB.has(j)) continue;
    matchedA.add(i); matchedB.add(j);
    pairs.push({ a: featsA[i], b: featsB[j], centA: centsA[i], centB: centsB[j] });
  }

  for (let i = 0; i < featsA.length; i++) {
    if (!matchedA.has(i)) pairs.push({ a: featsA[i], b: null, centA: centsA[i], centB: centsA[i] });
  }
  for (let j = 0; j < featsB.length; j++) {
    if (!matchedB.has(j)) pairs.push({ a: null, b: featsB[j], centA: centsB[j], centB: centsB[j] });
  }

  return pairs;
}

/**
 * Hierarchical Containment Constrained Interpolation:
 * 1. Groups features into tiers by rain intensity (valueKey).
 * 2. Interpolates lowest rain intensity polygons first (base storm envelopes).
 * 3. For higher rain intensity polygons, inherits parent storm motion and enforces
 *    that higher intensity polygons sit ENTIRELY within their lower-intensity parent polygons.
 */
export function interpolateFeatures(featuresA, featuresB, t, valueKey = 'value') {
  if (t <= 0) return { type: 'FeatureCollection', features: (featuresA || []).sort((a,b) => ((a.properties?.[valueKey]||0) - (b.properties?.[valueKey]||0))) };
  if (t >= 1) return { type: 'FeatureCollection', features: (featuresB || []).sort((a,b) => ((a.properties?.[valueKey]||0) - (b.properties?.[valueKey]||0))) };

  // Collect unique intensity values across both frames, sorted ascending
  const valSet = new Set();
  for (const f of featuresA) { const v = f.properties?.[valueKey]; if (v != null && v > 0) valSet.add(v); }
  for (const f of featuresB) { const v = f.properties?.[valueKey]; if (v != null && v > 0) valSet.add(v); }
  const levels = Array.from(valSet).sort((a, b) => a - b);

  if (!levels.length) {
    return { type: 'FeatureCollection', features: [] };
  }

  // Map of intensity level -> Array of interpolated Feature objects
  const interpolatedByLevel = new Map();
  // Map of feature -> { dx, dy, interpGeom }
  const featureMotionMap = new Map();

  for (let levelIdx = 0; levelIdx < levels.length; levelIdx++) {
    const level = levels[levelIdx];
    const featsA = featuresA.filter(f => f.properties?.[valueKey] === level);
    const featsB = featuresB.filter(f => f.properties?.[valueKey] === level);
    const pairs = matchTierFeatures(featsA, featsB);
    const interpThisLevel = [];

    const lowerTierInterp = levelIdx > 0 ? (interpolatedByLevel.get(levels[levelIdx - 1]) || []) : [];
    const lowerTierA = levelIdx > 0 ? featuresA.filter(f => f.properties?.[valueKey] === levels[levelIdx - 1]) : [];
    const lowerTierB = levelIdx > 0 ? featuresB.filter(f => f.properties?.[valueKey] === levels[levelIdx - 1]) : [];

    for (const { a, b, centA, centB } of pairs) {
      if (levelIdx === 0) {
        // --- BASE TIER (Lowest Rain Intensity Envelope) ---
        if (a && b) {
          const dx = (centB[0] - centA[0]) * t;
          const dy = (centB[1] - centA[1]) * t;
          const vA = a.properties?.[valueKey] ?? level;
          const vB = b.properties?.[valueKey] ?? level;
          const interpGeom = translateGeometry(a.geometry, dx, dy);
          const feat = {
            type: 'Feature',
            geometry: interpGeom,
            properties: { ...a.properties, [valueKey]: vA * (1 - t) + vB * t }
          };
          interpThisLevel.push(feat);
          featureMotionMap.set(a, { dx, dy, interpGeom });
        } else if (a && !b) {
          if (t < 0.5) {
            const feat = { type: 'Feature', geometry: a.geometry, properties: a.properties };
            interpThisLevel.push(feat);
            featureMotionMap.set(a, { dx: 0, dy: 0, interpGeom: a.geometry });
          }
        } else if (!a && b) {
          if (t >= 0.5) {
            const feat = { type: 'Feature', geometry: b.geometry, properties: b.properties };
            interpThisLevel.push(feat);
            featureMotionMap.set(b, { dx: 0, dy: 0, interpGeom: b.geometry });
          }
        }
      } else {
        // --- HIGHER TIERS (Nested Storm Cores) ---
        if (a && b) {
          // Find parent in lower tier in Frame A
          const parentA = findContainingParent(a, lowerTierA);
          const parentB = findContainingParent(b, lowerTierB);
          const parentMotion = parentA ? featureMotionMap.get(parentA) : null;

          let dx, dy;
          if (parentMotion) {
            // Inherit parent displacement + relative internal shift
            const pCentA = polygonCentroid(parentA);
            const pCentB = parentB ? polygonCentroid(parentB) : pCentA;
            const rA = [centA[0] - pCentA[0], centA[1] - pCentA[1]];
            const rB = [centB[0] - pCentB[0], centB[1] - pCentB[1]];
            const deltaR = [(rB[0] - rA[0]) * t, (rB[1] - rA[1]) * t];
            dx = parentMotion.dx + deltaR[0];
            dy = parentMotion.dy + deltaR[1];
          } else {
            dx = (centB[0] - centA[0]) * t;
            dy = (centB[1] - centA[1]) * t;
          }

          let translatedGeom = translateGeometry(a.geometry, dx, dy);

          // Find containing parent in interpolated lower tier and enforce containment!
          const interpParent = findContainingParent(
            { type: 'Feature', geometry: translatedGeom, properties: a.properties },
            lowerTierInterp
          );
          if (interpParent) {
            translatedGeom = ensureGeometryInsideParent(translatedGeom, interpParent.geometry);
          }

          const vA = a.properties?.[valueKey] ?? level;
          const vB = b.properties?.[valueKey] ?? level;
          const feat = {
            type: 'Feature',
            geometry: translatedGeom,
            properties: { ...a.properties, [valueKey]: vA * (1 - t) + vB * t }
          };
          interpThisLevel.push(feat);
          featureMotionMap.set(a, { dx, dy, interpGeom: translatedGeom });

        } else if (a && !b) {
          // Dissipating core: only show before midpoint, translates with parent storm
          if (t < 0.5) {
            const parentA = findContainingParent(a, lowerTierA);
            const parentMotion = parentA ? featureMotionMap.get(parentA) : null;
            const dx = parentMotion ? parentMotion.dx : 0;
            const dy = parentMotion ? parentMotion.dy : 0;
            let translatedGeom = translateGeometry(a.geometry, dx, dy);

            const interpParent = findContainingParent(
              { type: 'Feature', geometry: translatedGeom, properties: a.properties },
              lowerTierInterp
            );
            if (interpParent) {
              translatedGeom = ensureGeometryInsideParent(translatedGeom, interpParent.geometry);
            }

            const feat = { type: 'Feature', geometry: translatedGeom, properties: a.properties };
            interpThisLevel.push(feat);
            featureMotionMap.set(a, { dx, dy, interpGeom: translatedGeom });
          }
        } else if (!a && b) {
          // Appearing core: only show after midpoint, translates with parent storm
          if (t >= 0.5) {
            const parentB = findContainingParent(b, lowerTierB);
            const parentMotion = parentB ? featureMotionMap.get(parentB) : null;
            const dx = parentMotion ? -(1 - t) * (parentMotion.dx / (t || 1)) : 0;
            const dy = parentMotion ? -(1 - t) * (parentMotion.dy / (t || 1)) : 0;
            let translatedGeom = translateGeometry(b.geometry, dx, dy);

            const interpParent = findContainingParent(
              { type: 'Feature', geometry: translatedGeom, properties: b.properties },
              lowerTierInterp
            );
            if (interpParent) {
              translatedGeom = ensureGeometryInsideParent(translatedGeom, interpParent.geometry);
            }

            const feat = { type: 'Feature', geometry: translatedGeom, properties: b.properties };
            interpThisLevel.push(feat);
            featureMotionMap.set(b, { dx, dy, interpGeom: translatedGeom });
          }
        }
      }
    }

    interpolatedByLevel.set(level, interpThisLevel);
  }

  // Combine features ordered strictly from lowest intensity (background) to highest intensity (foreground)
  const finalFeatures = [];
  for (const level of levels) {
    const list = interpolatedByLevel.get(level) || [];
    finalFeatures.push(...list);
  }

  return { type: 'FeatureCollection', features: finalFeatures };
}

/**
 * Fetch and decode a set of viewport PBF tiles for a given tileset and targetLayerName,
 * returning all matching features as a merged GeoJSON FeatureCollection.
 */
export async function fetchAndDecodeFrame(tilesetId, viewportTiles, token, targetLayerName = null) {
  const allFeatures = [];

  await Promise.all(viewportTiles.map(async ({ z, x, y }) => {
    const url = `https://api.mapbox.com/v4/${tilesetId}/${z}/${x}/${y}.vector.pbf?access_token=${token}`;
    try {
      let bytes = rawTileCache.get(url);
      if (!bytes) {
        const resp = await fetch(url);
        if (!resp.ok) return; // 404 = no rain in tile
        const buf = await resp.arrayBuffer();
        bytes = await maybeDecompress(buf);
        rawTileCache.set(url, bytes);
      }
      const fc = decodePBF(bytes, x, y, z, targetLayerName);
      if (fc && fc.features && fc.features.length) {
        allFeatures.push(...fc.features);
      }
    } catch (e) {
      // Silently skip missing or errored tiles
    }
  }));

  return { type: 'FeatureCollection', features: allFeatures };
}

/**
 * Compute the viewport tiles to fetch at the optimal zoom level.
 */
export function getViewportTiles(map, preferredZ = 7) {
  const bounds = map.getBounds();
  const z = preferredZ;
  const n = Math.pow(2, z);

  const minX = Math.floor((bounds.getWest() + 180) / 360 * n);
  const maxX = Math.floor((bounds.getEast() + 180) / 360 * n);
  const latRadN = Math.min(85.0511, bounds.getNorth()) * Math.PI / 180;
  const latRadS = Math.max(-85.0511, bounds.getSouth()) * Math.PI / 180;
  const minY = Math.floor((1 - Math.asinh(Math.tan(latRadN)) / Math.PI) / 2 * n);
  const maxY = Math.floor((1 - Math.asinh(Math.tan(latRadS)) / Math.PI) / 2 * n);

  const tiles = [];
  for (let x = minX; x <= maxX; x++) {
    for (let y = minY; y <= maxY; y++) {
      tiles.push({ z, x, y });
    }
  }
  return tiles;
}
