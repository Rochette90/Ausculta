#!/usr/bin/env node
/**
 * Génère les ECG 12 dérivations des stations ECOS en SVG (papier millimétré,
 * 25 mm/s, 10 mm/mV) : `public/ecos/ecg/<code>.svg`. Tracés synthétiques,
 * propres à chaque cas : aucun droit d'image à gérer. Le nom du fichier est
 * le code public de la station, jamais le diagnostic.
 *
 *   node scripts/generate-ecg.mjs
 *
 * Chaque cas décrit le rythme (`sinus` ou `fa`), la fréquence, et par
 * dérivation les décalages du segment ST et du PR (mV), l'amplitude de
 * l'onde T (facteur) et les ondes Q pathologiques. Les résultats texte des
 * stations doivent rester cohérents avec ces paramètres.
 */
import { mkdirSync, writeFileSync } from "node:fs";


// Amplitudes de base (mV) d'un ECG normal de l'adulte.
const NORMAL = {
  I: { p: 0.1, q: -0.05, r: 0.6, s: -0.1, t: 0.25 },
  II: { p: 0.15, q: -0.05, r: 1.0, s: -0.15, t: 0.35 },
  III: { p: 0.05, q: -0.05, r: 0.45, s: -0.1, t: 0.12 },
  aVR: { p: -0.1, q: 0, r: 0.1, s: -0.75, t: -0.25 },
  aVL: { p: 0.05, q: -0.05, r: 0.4, s: -0.2, t: 0.1 },
  aVF: { p: 0.1, q: -0.05, r: 0.7, s: -0.1, t: 0.22 },
  V1: { p: 0.06, q: 0, r: 0.2, s: -0.9, t: 0.08 },
  V2: { p: 0.08, q: 0, r: 0.4, s: -1.2, t: 0.45 },
  V3: { p: 0.08, q: 0, r: 0.7, s: -0.8, t: 0.45 },
  V4: { p: 0.08, q: -0.05, r: 1.2, s: -0.4, t: 0.4 },
  V5: { p: 0.08, q: -0.07, r: 1.1, s: -0.2, t: 0.32 },
  V6: { p: 0.08, q: -0.07, r: 0.8, s: -0.1, t: 0.25 },
};

const CASES = {
  // SCA avec sus-décalage ST inférieur, miroir en DI et aVL.
  "station-01": { rhythm: "sinus", rate: 98, st: { II: 0.3, III: 0.38, aVF: 0.34, I: -0.12, aVL: -0.22, V1: -0.05, V2: -0.1 }, t: { II: 1.2, III: 1.8, aVF: 1.4, aVL: -0.8 } },
  "station-02": { rhythm: "fa", rate: 132 },
  "station-03": { rhythm: "fa", rate: 90 },
  "station-06": { rhythm: "sinus", rate: 96 },
  "station-07": { rhythm: "sinus", rate: 108 },
  "station-09": { rhythm: "sinus", rate: 108 },
  // Ondes T un peu amples.
  "station-10": { rhythm: "sinus", rate: 118, t: { V2: 1.7, V3: 1.8, V4: 1.7, V5: 1.5, II: 1.4, aVF: 1.4 } },
  "station-11": { rhythm: "sinus", rate: 112 },
  // Séquelle d'infarctus antérieur : QS de V1 à V3, petite onde q en V4.
  "station-20": { rhythm: "sinus", rate: 96, q: { V1: 0.4, V2: 0.6, V3: 0.5, V4: 0.2 }, r: { V1: 0, V2: 0, V3: 0.1, V4: 0.6 }, t: { V2: 0.5, V3: 0.6 } },
  "station-22": { rhythm: "fa", rate: 90 },
  // Péricardite : sus-décalage ST diffus concave, PR abaissé ; aVR en miroir.
  "blanc-01": {
    rhythm: "sinus", rate: 98,
    st: { I: 0.18, II: 0.22, aVL: 0.12, V2: 0.18, V3: 0.22, V4: 0.24, V5: 0.22, V6: 0.18, aVR: -0.18 },
    pr: { I: -0.06, II: -0.1, aVF: -0.07, V4: -0.06, V5: -0.09, V6: -0.09, aVR: 0.1 },
  },
  "blanc-06": { rhythm: "sinus", rate: 72 },
  "blanc-09": { rhythm: "sinus", rate: 84 },
  "blanc-13": { rhythm: "sinus", rate: 76 },
};

/** Générateur pseudo-aléatoire déterministe (un tracé identique à chaque génération). */
function random(seed) {
  let state = [...seed].reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) >>> 0, 2166136261);
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

const gauss = (t, center, sigma) => Math.exp(-((t - center) ** 2) / (2 * sigma * sigma));
const smooth = (t, from, to) => { const x = Math.min(1, Math.max(0, (t - from) / (to - from))); return x * x * (3 - 2 * x); };

/** Instants des complexes QRS sur 10 secondes. */
function beats(spec, rand) {
  const mean = 60 / spec.rate;
  const times = [];
  let t = 0.25 + rand() * 0.2;
  while (t < 10.5) {
    times.push(t);
    t += spec.rhythm === "fa" ? mean * (0.65 + rand() * 0.7) : mean * (1 + (rand() - 0.5) * 0.02);
  }
  return times;
}

/** Tension (mV) d'une dérivation à l'instant t. */
function voltage(lead, spec, beatTimes, t, phases) {
  const base = NORMAL[lead];
  const st = spec.st?.[lead] ?? 0;
  const pr = spec.pr?.[lead] ?? 0;
  const tScale = spec.t?.[lead] ?? 1;
  const qDeep = spec.q?.[lead];
  const r = spec.r?.[lead] !== undefined ? spec.r[lead] * base.r : base.r;
  const mean = 60 / spec.rate;
  // QT raccourci quand la fréquence monte.
  const tCenter = 0.2 + 0.13 * Math.sqrt(Math.min(mean, 1.1));
  let v = 0;
  for (const beat of beatTimes) {
    const x = t - beat;
    if (x < -0.3 || x > 0.7) continue;
    if (spec.rhythm === "sinus") {
      v += base.p * gauss(x, -0.12, 0.022);
      // Segment PR : entre la fin de P et le QRS.
      v += pr * smooth(x, -0.09, -0.07) * (1 - smooth(x, -0.015, 0));
    }
    if (qDeep && r === 0) {
      // Complexe QS : une seule déflexion négative, large.
      v -= (qDeep + Math.abs(base.s) * 0.6) * gauss(x, 0.04, 0.019);
    } else {
      const q = qDeep ? -qDeep : base.q;
      v += q * gauss(x, 0.012, qDeep ? 0.014 : 0.007);
      v += r * gauss(x, 0.04, 0.0105);
      v += base.s * gauss(x, 0.066, 0.011);
    }
    // Segment ST décalé, qui rejoint l'onde T (concave).
    v += st * smooth(x, 0.07, 0.1) * (1 - smooth(x, tCenter + 0.02, tCenter + 0.14));
    const tAmp = base.t * tScale;
    v += tAmp * (x < tCenter ? gauss(x, tCenter, 0.055) : gauss(x, tCenter, 0.04));
  }
  if (spec.rhythm === "fa") {
    const weight = { V1: 1, II: 0.8, III: 0.7, aVF: 0.7, V2: 0.6 }[lead] ?? 0.35;
    v += weight * 0.045 * (Math.sin(2 * Math.PI * 5.7 * t + phases[0]) + 0.6 * Math.sin(2 * Math.PI * 7.3 * t + phases[1]) + 0.4 * Math.sin(2 * Math.PI * 4.1 * t + phases[2]));
  }
  return v;
}

// Mise en page (mm) : 4 colonnes de 2,5 s sur 3 lignes, puis DII long.
const PX = 4;
const MARGIN = 10;
const WIDTH = 250 + 2 * MARGIN;
const ROW = 35;
const HEIGHT = ROW * 4 + 20;
const LAYOUT = [["I", "aVR", "V1", "V4"], ["II", "aVL", "V2", "V5"], ["III", "aVF", "V3", "V6"]];

/** Papier millimétré : carreaux de 1 mm, traits plus marqués tous les 5 mm. */
function grid() {
  const small = PX;
  const large = 5 * PX;
  return `<defs><pattern id="m" width="${small}" height="${small}" patternUnits="userSpaceOnUse"><path d="M${small} 0V${small}H0" class="m" fill="none"/></pattern>`
    + `<pattern id="M" width="${large}" height="${large}" patternUnits="userSpaceOnUse"><rect width="${large}" height="${large}" fill="url(#m)"/><path d="M${large} 0V${large}H0" class="M" fill="none"/></pattern></defs>`
    + `<rect width="100%" height="100%" fill="url(#M)"/>`;
}

function path(points) {
  return points.map(([x, y], index) => `${index ? "L" : "M"}${(x * PX).toFixed(1)} ${(y * PX).toFixed(1)}`).join("");
}

function render(code, spec) {
  const rand = random(code);
  const beatTimes = beats(spec, rand);
  const phases = [rand() * 6.28, rand() * 6.28, rand() * 6.28];
  const noise = () => (rand() - 0.5) * 0.012;
  const trace = (lead, from, to, x0, baseline) => {
    const points = [];
    for (let t = from; t <= to + 1e-9; t += 0.005) points.push([x0 + (t - from) * 25, baseline - (voltage(lead, spec, beatTimes, t, phases) + noise()) * 10]);
    return path(points);
  };
  const parts = [];
  const labels = [];
  const calibration = (baseline) => path([[MARGIN - 7, baseline], [MARGIN - 6, baseline], [MARGIN - 6, baseline - 10], [MARGIN - 1, baseline - 10], [MARGIN - 1, baseline], [MARGIN, baseline]]);
  LAYOUT.forEach((row, rowIndex) => {
    const baseline = 22 + rowIndex * ROW;
    parts.push(calibration(baseline));
    row.forEach((lead, column) => {
      const x0 = MARGIN + column * 62.5;
      parts.push(trace(lead, column * 2.5, (column + 1) * 2.5, x0, baseline));
      if (column) parts.push(path([[x0, baseline - 4], [x0, baseline + 4]]));
      labels.push(`<text x="${(x0 + 2) * PX}" y="${(baseline - 12) * PX}">${lead}</text>`);
    });
  });
  const rhythmBaseline = 22 + 3 * ROW;
  parts.push(calibration(rhythmBaseline));
  parts.push(trace("II", 0, 10, MARGIN, rhythmBaseline));
  labels.push(`<text x="${(MARGIN + 2) * PX}" y="${(rhythmBaseline - 12) * PX}">II</text>`);
  labels.push(`<text x="${(WIDTH - MARGIN) * PX}" y="${(HEIGHT - 3) * PX}" text-anchor="end" class="foot">25 mm/s · 10 mm/mV</text>`);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH * PX} ${HEIGHT * PX}" width="${WIDTH * PX}" height="${HEIGHT * PX}" role="img">
<style>.m{stroke:#efb3b9;stroke-width:0.7}.M{stroke:#de7b86;stroke-width:1.3}.w{fill:none;stroke:#1b1b1b;stroke-width:1.6;stroke-linejoin:round}text{font:600 22px Helvetica,Arial,sans-serif;fill:#1b1b1b}.foot{font-weight:400;font-size:18px}</style>
<rect width="100%" height="100%" fill="#fff7f7"/>${grid()}<path class="w" d="${parts.join("")}"/>${labels.join("")}
</svg>
`;
}

const directory = new URL("../public/ecos/ecg/", import.meta.url);
mkdirSync(directory, { recursive: true });
for (const [code, spec] of Object.entries(CASES)) {
  writeFileSync(new URL(`${code}.svg`, directory), render(code, spec));
  console.log(`public/ecos/ecg/${code}.svg`);
}
