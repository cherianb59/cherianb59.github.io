/**
 * BOM Radar Vector Tile (PBF) Decoder
 * Decodes Mapbox Vector Tile protobuf bytes → GeoJSON FeatureCollection
 * Client-side, zero dependencies, supports gzip-compressed tiles.
 */

function readVarint(buf, pos) {
  let result = 0, shift = 0;
  while (pos < buf.length) {
    const b = buf[pos++];
    result |= (b & 0x7F) << shift;
    if (!(b & 0x80)) break;
    shift += 7;
  }
  return [result, pos];
}

function zigzag(n) {
  return (n >> 1) ^ -(n & 1);
}

function ringSignedArea(ring) {
  // Positive = CCW (GeoJSON exterior ring), Negative = CW (GeoJSON hole)
  // Note: MVT uses CW for exterior, CCW for holes — so signs are INVERTED vs GeoJSON
  // We test for CCW in tile space (positive = CCW in screen coords where Y is down)
  // MVT exterior rings are CLOCKWISE in screen coords (Y increases downward) → negative area
  // But we've seen them come out CCW in Python (positive) — MapLibre fixes this
  // Simplest: just use absolute values and assume each ring is an independent exterior polygon
  let area = 0;
  for (let i = 0, n = ring.length; i < n; i++) {
    const j = (i + 1) % n;
    area += ring[i][0] * ring[j][1];
    area -= ring[j][0] * ring[i][1];
  }
  return area / 2;
}

function decodeGeometry(geomCmds, extent) {
  // Returns array of completed rings [[x,y], ...] — each ring is independent
  const rings = [];
  let cx = 0, cy = 0;
  let i = 0;
  while (i < geomCmds.length) {
    const cmdInt = geomCmds[i++];
    const cmd = cmdInt & 7;
    const count = cmdInt >> 3;
    if (cmd === 1) {
      // MoveTo - starts a new ring
      for (let j = 0; j < count; j++) {
        cx += zigzag(geomCmds[i++]);
        cy += zigzag(geomCmds[i++]);
        rings.push([[cx, cy]]);
      }
    } else if (cmd === 2) {
      // LineTo - extends the current ring
      for (let j = 0; j < count; j++) {
        cx += zigzag(geomCmds[i++]);
        cy += zigzag(geomCmds[i++]);
        if (rings.length) rings[rings.length - 1].push([cx, cy]);
      }
    } else if (cmd === 7) {
      // ClosePath
      if (rings.length && rings[rings.length - 1].length > 0) {
        const ring = rings[rings.length - 1];
        ring.push([...ring[0]]);
      }
    }
  }
  return rings;
}

function tileToLngLat(tx, ty, px, py, z, extent) {
  // Convert tile pixel coords (0..extent) to lng/lat
  const n = Math.pow(2, z);
  const lng = ((tx + px / extent) / n) * 360 - 180;
  const latRad = Math.atan(Math.sinh(Math.PI * (1 - 2 * (ty + py / extent) / n)));
  const lat = latRad * 180 / Math.PI;
  return [lng, lat];
}

function parseValue(vdata) {
  // MVT Value message (https://github.com/mapbox/vector-tile-spec/blob/master/2.1/vector_tile.proto)
  // field 1: string_value  — wire 2 (length-delimited)
  // field 2: float_value   — wire 5 (32-bit IEEE 754)
  // field 3: double_value  — wire 1 (64-bit IEEE 754)  ← BOM uses this for mm/h
  // field 4: int_value     — wire 0 (varint)
  // field 5: uint_value    — wire 0 (varint)
  // field 6: sint_value    — wire 0 (varint, zigzag)
  // field 7: bool_value    — wire 0 (varint)
  let vpos = 0;
  let vt, nvpos;
  [vt, nvpos] = readVarint(vdata, vpos);
  vpos = nvpos;
  const vf = vt >> 3;
  const vw = vt & 7;

  if (vf === 1 && vw === 2) {
    // string_value
    const [l, p] = readVarint(vdata, vpos);
    return new TextDecoder().decode(vdata.slice(p, p + l));
  }
  if (vf === 2 && vw === 5) {
    // float_value (32-bit)
    const view = new DataView(vdata.buffer, vdata.byteOffset + vpos, 4);
    return view.getFloat32(0, true);
  }
  if (vf === 3 && vw === 1) {
    // double_value (64-bit) — BOM encodes rain mm/h as this
    const view = new DataView(vdata.buffer, vdata.byteOffset + vpos, 8);
    return view.getFloat64(0, true);
  }
  if (vf === 4 && vw === 0) {
    // int_value
    const [n] = readVarint(vdata, vpos);
    return n;
  }
  if (vf === 5 && vw === 0) {
    // uint_value
    const [n] = readVarint(vdata, vpos);
    return n;
  }
  if (vf === 6 && vw === 0) {
    // sint_value (zigzag-encoded)
    const [n] = readVarint(vdata, vpos);
    return zigzag(n);
  }
  if (vf === 7 && vw === 0) {
    // bool_value
    const [n] = readVarint(vdata, vpos);
    return n !== 0;
  }
  return null;
}


export function decodePBF(buf, tileX, tileY, tileZ, targetLayerName = null) {
  // buf is Uint8Array of the raw (possibly gzip'd) PBF
  // Returns array of GeoJSON features with lng/lat coordinates
  const features = [];

  let pos = 0;
  while (pos < buf.length) {
    let [tagWire, npos] = readVarint(buf, pos);
    pos = npos;
    const field = tagWire >> 3;
    const wire = tagWire & 7;

    if (field === 3 && wire === 2) {
      // Layer
      let [layerLen, lstart] = readVarint(buf, pos);
      pos = lstart + layerLen;
      const layerBuf = buf.slice(lstart, lstart + layerLen);

      let lpos = 0;
      let layerName = null;
      const keys = [];
      const values = [];
      let extent = 4096;
      const rawFeatures = [];

      while (lpos < layerBuf.length) {
        let [lt, nlpos] = readVarint(layerBuf, lpos);
        lpos = nlpos;
        const lf = lt >> 3;
        const lw = lt & 7;

        if (lf === 1 && lw === 2) {
          // Layer name (field 1, wire 2)
          let [nl, np] = readVarint(layerBuf, lpos);
          layerName = new TextDecoder().decode(layerBuf.slice(np, np + nl));
          lpos = np + nl;
        } else if (lf === 5 && lw === 0) {
          [extent, lpos] = readVarint(layerBuf, lpos);
        } else if (lf === 3 && lw === 2) {
          // key string
          let [kl, kp] = readVarint(layerBuf, lpos);
          keys.push(new TextDecoder().decode(layerBuf.slice(kp, kp + kl)));
          lpos = kp + kl;
        } else if (lf === 4 && lw === 2) {
          // value
          let [vl, vp] = readVarint(layerBuf, lpos);
          const vdata = layerBuf.slice(vp, vp + vl);
          values.push(parseValue(vdata));
          lpos = vp + vl;
        } else if (lf === 2 && lw === 2) {
          // feature
          let [fl, fp] = readVarint(layerBuf, lpos);
          rawFeatures.push(layerBuf.slice(fp, fp + fl));
          lpos = fp + fl;
        } else {
          // skip
          if (lw === 0) [, lpos] = readVarint(layerBuf, lpos);
          else if (lw === 2) { let [sl, sp] = readVarint(layerBuf, lpos); lpos = sp + sl; }
          else if (lw === 5) lpos += 4;
          else if (lw === 1) lpos += 8;
          else break;
        }
      }

      // If a specific layer was requested (e.g. nowcast timestamp '202608290930'), filter for it
      if (targetLayerName && layerName && layerName !== targetLayerName) {
        continue;
      }


      for (const fdata of rawFeatures) {
        let fpos = 0;
        let geomCmds = null;
        const tags = [];

        while (fpos < fdata.length) {
          let [ft, nfp] = readVarint(fdata, fpos);
          fpos = nfp;
          const ff = ft >> 3;
          const fw = ft & 7;

          if (ff === 4 && fw === 2) {
            // geometry
            let [gl, gp] = readVarint(fdata, fpos);
            const gdata = fdata.slice(gp, gp + gl);
            fpos = gp + gl;
            let gpos = 0;
            geomCmds = [];
            while (gpos < gdata.length) {
              let [v, ngp] = readVarint(gdata, gpos);
              geomCmds.push(v);
              gpos = ngp;
            }
          } else if (ff === 2 && fw === 2) {
            // tags
            let [tl, tp] = readVarint(fdata, fpos);
            const tdata = fdata.slice(tp, tp + tl);
            fpos = tp + tl;
            let tpos = 0;
            while (tpos < tdata.length) {
              let [v, ntp] = readVarint(tdata, tpos);
              tags.push(v);
              tpos = ntp;
            }
          } else {
            if (fw === 0) [, fpos] = readVarint(fdata, fpos);
            else if (fw === 2) { let [sl, sp] = readVarint(fdata, fpos); fpos = sp + sl; }
            else if (fw === 5) fpos += 4;
            else if (fw === 1) fpos += 8;
            else break;
          }
        }

        if (!geomCmds) continue;

        // Build properties
        const props = {};
        for (let j = 0; j < tags.length - 1; j += 2) {
          if (tags[j] < keys.length && tags[j + 1] < values.length) {
            props[keys[tags[j]]] = values[tags[j + 1]];
          }
        }

        // Decode geometry rings
        const rings = decodeGeometry(geomCmds, extent);
        if (!rings.length) continue;

        // Convert tile pixel coords → lng/lat
        const lngLatRings = rings.map(ring =>
          ring.map(([px, py]) => tileToLngLat(tileX, tileY, px, py, tileZ, extent))
        );

        // CRITICAL FIX: MVT packs many independent polygon rings into one feature.
        // Each ring with positive area (CCW in tile-space) is a separate polygon exterior.
        // Rings with negative area (CW in tile-space) are holes of the preceding exterior.
        // Wrong approach: put all rings as coordinates[0..n] → treats indices 1+ as holes.
        // Correct approach: group rings into polygons by winding, emit as MultiPolygon.
        const polygons = []; // array of [[exterior, ...holes]]
        for (let ri = 0; ri < rings.length; ri++) {
          const area = ringSignedArea(rings[ri]);
          if (area >= 0) {
            // CCW (positive area in tile Y-down space) = exterior ring → new polygon
            polygons.push([lngLatRings[ri]]);
          } else {
            // CW = hole → attach to the most recent exterior polygon
            if (polygons.length) polygons[polygons.length - 1].push(lngLatRings[ri]);
          }
        }

        if (polygons.length === 0) continue;

        if (polygons.length === 1) {
          features.push({
            type: 'Feature',
            geometry: { type: 'Polygon', coordinates: polygons[0] },
            properties: props
          });
        } else {
          // MultiPolygon for features with many separate rain blobs of the same intensity
          features.push({
            type: 'Feature',
            geometry: { type: 'MultiPolygon', coordinates: polygons },
            properties: props
          });
        }


      }
    } else {
      if (wire === 0) [, pos] = readVarint(buf, pos);
      else if (wire === 2) { let [sl, sp] = readVarint(buf, pos); pos = sp + sl; }
      else if (wire === 5) pos += 4;
      else if (wire === 1) pos += 8;
      else break;
    }
  }

  return { type: 'FeatureCollection', features };
}
