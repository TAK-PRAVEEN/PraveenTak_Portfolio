/**
 * ascii-portrait.mjs
 * Renders public/portrait-source.png as binary (1/0) ASCII art using the
 * same rules as the WebGL particle portrait: the blue sky is chroma-keyed
 * away and brightness drives digit density (lit face = dense digits,
 * shadow dissolves to nothing).
 *
 *   node scripts/ascii-portrait.mjs [cols]
 */
import fs from "node:fs";
import { PNG } from "pngjs";

const COLS = Number(process.argv[2]) || 100;
const CHAR_ASPECT = 0.5; // terminal chars are ~2x taller than wide
const HEAD_CROP = 0.62; // only the top of the image (head/shoulders)

const png = PNG.sync.read(fs.readFileSync(new URL("../public/portrait-source.png", import.meta.url)));
const { width: W, height: H0, data } = png;
const H = Math.floor(H0 * HEAD_CROP);
const ROWS = Math.round((COLS / (W / H)) * CHAR_ASPECT);

const luma = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b;

const lines = [];
for (let ry = 0; ry < ROWS; ry++) {
  let line = "";
  for (let cx = 0; cx < COLS; cx++) {
    const x0 = Math.floor((cx / COLS) * W);
    const x1 = Math.max(x0 + 1, Math.floor(((cx + 1) / COLS) * W));
    const y0 = Math.floor((ry / ROWS) * H);
    const y1 = Math.max(y0 + 1, Math.floor(((ry + 1) / ROWS) * H));

    let rs = 0, gs = 0, bs = 0, n = 0, sky = 0;
    for (let y = y0; y < y1; y += 2) {
      for (let x = x0; x < x1; x += 2) {
        const i = (y * W + x) * 4;
        const r = data[i], g = data[i + 1], b = data[i + 2];
        const L = luma(r, g, b);
        const maxc = Math.max(r, g, b), minc = Math.min(r, g, b);
        const sat = maxc === 0 ? 0 : (maxc - minc) / maxc;
        if ((b > 110 && b >= g - 5 && g >= r && b - r > 12 && L > 100) || (L > 212 && sat < 0.12)) sky++;
        rs += r; gs += g; bs += b; n++;
      }
    }
    if (!n || sky / n > 0.5) { line += " "; continue; }

    const L = luma(rs / n, gs / n, bs / n);
    const digit = (cx * 31 + ry * 17) % 2 ? "1" : "0"; // deterministic 1/0 mix
    const d3 = (cx * 7 + ry * 13) % 3;
    if (L > 140) line += digit;              // lit → solid digits
    else if (L > 85) line += d3 !== 0 ? digit : " "; // mid → ~66% density
    else if (L > 42) line += d3 === 0 ? digit : " "; // shadow → ~33%
    else line += " ";                         // dark → dissolves
  }
  lines.push(line.replace(/\s+$/, ""));
}
while (lines.length && !lines[0]) lines.shift();
while (lines.length && !lines[lines.length - 1]) lines.pop();

process.stdout.write(lines.join("\n") + "\n");
