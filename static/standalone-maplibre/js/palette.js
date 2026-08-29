/**
 * Official 15-Class BOM Rain Radar Color Gradient Specification
 * Index 0: Transparent (< 0.15 mm/h)
 * Level 1: Pure White (0.2 mm/h light rain)
 * Levels 2-15: Calibrated BOM precipitation intensity ramp in mm/h
 */

export const BOM_RAIN_LEVELS = [
  { level: 0, minMm: 0.0, label: 'None', rgba: [0, 0, 0, 0], hex: 'transparent' },
  { level: 1, minMm: 0.2, label: '0.2', rgba: [255, 255, 255, 190], hex: '#FFFFFF' },
  { level: 2, minMm: 0.5, label: '0.5', rgba: [180, 180, 255, 220], hex: '#B4B4FF' },
  { level: 3, minMm: 1.0, label: '1.0', rgba: [120, 120, 255, 255], hex: '#7878FF' },
  { level: 4, minMm: 2.0, label: '2.0', rgba: [20, 20, 255, 255], hex: '#1414FF' },
  { level: 5, minMm: 4.0, label: '4.0', rgba: [0, 216, 195, 255], hex: '#00D8C3' },
  { level: 6, minMm: 8.0, label: '8.0', rgba: [0, 150, 144, 255], hex: '#009690' },
  { level: 7, minMm: 15.0, label: '15', rgba: [0, 102, 102, 255], hex: '#006666' },
  { level: 8, minMm: 25.0, label: '25', rgba: [255, 255, 0, 255], hex: '#FFFF00' },
  { level: 9, minMm: 40.0, label: '40', rgba: [255, 200, 0, 255], hex: '#FFC800' },
  { level: 10, minMm: 60.0, label: '60', rgba: [255, 150, 0, 255], hex: '#FF9600' },
  { level: 11, minMm: 90.0, label: '90', rgba: [255, 100, 0, 255], hex: '#FF6400' },
  { level: 12, minMm: 130.0, label: '130', rgba: [255, 0, 0, 255], hex: '#FF0000' },
  { level: 13, minMm: 180.0, label: '180', rgba: [200, 0, 0, 255], hex: '#C80000' },
  { level: 14, minMm: 250.0, label: '250', rgba: [120, 0, 0, 255], hex: '#780000' },
  { level: 15, minMm: 360.0, label: '>360', rgba: [40, 0, 0, 255], hex: '#280000' }
];

export function getMapLibreFillColorExpression() {
  return [
    'step',
    ['coalesce', ['get', 'value'], 0],  // guard: null value → 0 → transparent
    'rgba(0,0,0,0)',                     // < 0.15 mm/h: Transparent
    0.15, 'rgba(255, 255, 255, 0.88)',  // Level 1: 0.2 mm/h (Pure White)
    0.35, 'rgba(180, 180, 255, 0.92)',  // Level 2: 0.5 mm/h (Light Blue)
    0.75, 'rgba(120, 120, 255, 1.0)',   // Level 3: 1.0 mm/h (Mid Blue)
    1.5,  'rgba(20, 20, 255, 1.0)',     // Level 4: 2.0 mm/h (Vivid Blue)
    3.0,  'rgba(0, 216, 195, 1.0)',     // Level 5: 4.0 mm/h (Cyan)
    6.0,  'rgba(0, 150, 144, 1.0)',     // Level 6: 8.0 mm/h (Mid Teal)
    11.0, 'rgba(0, 102, 102, 1.0)',     // Level 7: 15 mm/h (Dark Teal)
    20.0, 'rgba(255, 255, 0, 1.0)',     // Level 8: 25 mm/h (Yellow)
    32.0, 'rgba(255, 200, 0, 1.0)',     // Level 9: 40 mm/h (Gold)
    50.0, 'rgba(255, 150, 0, 1.0)',     // Level 10: 60 mm/h (Light Orange)
    75.0, 'rgba(255, 100, 0, 1.0)',     // Level 11: 90 mm/h (Dark Orange)
    110.0,'rgba(255, 0, 0, 1.0)',       // Level 12: 130 mm/h (Red)
    155.0,'rgba(200, 0, 0, 1.0)',       // Level 13: 180 mm/h (Dark Red)
    215.0,'rgba(120, 0, 0, 1.0)',       // Level 14: 250 mm/h (Deep Maroon)
    300.0,'rgba(40, 0, 0, 1.0)'         // Level 15: >360 mm/h (Black)
  ];
}

export function recolorImageData(imgData) {

  const data = imgData.data;
  const len = data.length;
  for (let i = 0; i < len; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    // Check transparent / black background
    if (a === 0 || (r === 0 && g === 0 && b === 0)) {
      data[i + 3] = 0;
      continue;
    }

    const val = Math.max(r, g, b);
    if (val < 10) {
      data[i] = 255; data[i + 1] = 255; data[i + 2] = 255; data[i + 3] = 185; // Pure White (Level 1)
    } else if (val < 25) {
      data[i] = 180; data[i + 1] = 180; data[i + 2] = 255; data[i + 3] = 220; // Light Blue
    } else if (val < 40) {
      data[i] = 120; data[i + 1] = 120; data[i + 2] = 255; data[i + 3] = 255; // Mid Blue
    } else if (val < 55) {
      data[i] = 20; data[i + 1] = 20; data[i + 2] = 255; data[i + 3] = 255;   // Vivid Blue
    } else if (val < 70) {
      data[i] = 0; data[i + 1] = 216; data[i + 2] = 195; data[i + 3] = 255;  // Cyan
    } else if (val < 85) {
      data[i] = 0; data[i + 1] = 150; data[i + 2] = 144; data[i + 3] = 255;  // Mid Teal
    } else if (val < 100) {
      data[i] = 0; data[i + 1] = 102; data[i + 2] = 102; data[i + 3] = 255;  // Dark Teal
    } else if (val < 115) {
      data[i] = 255; data[i + 1] = 255; data[i + 2] = 0; data[i + 3] = 255;  // Yellow
    } else if (val < 130) {
      data[i] = 255; data[i + 1] = 200; data[i + 2] = 0; data[i + 3] = 255;  // Gold
    } else if (val < 150) {
      data[i] = 255; data[i + 1] = 150; data[i + 2] = 0; data[i + 3] = 255;  // Light Orange
    } else if (val < 175) {
      data[i] = 255; data[i + 1] = 100; data[i + 2] = 0; data[i + 3] = 255;  // Dark Orange
    } else if (val < 200) {
      data[i] = 255; data[i + 1] = 0; data[i + 2] = 0; data[i + 3] = 255;    // Red
    } else if (val < 225) {
      data[i] = 200; data[i + 1] = 0; data[i + 2] = 0; data[i + 3] = 255;    // Dark Red
    } else if (val < 245) {
      data[i] = 120; data[i + 1] = 0; data[i + 2] = 0; data[i + 3] = 255;    // Deep Maroon
    } else {
      data[i] = 40; data[i + 1] = 0; data[i + 2] = 0; data[i + 3] = 255;     // Black
    }
  }
  return imgData;
}
