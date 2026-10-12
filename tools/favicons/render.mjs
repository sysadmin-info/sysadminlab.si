#!/usr/bin/env node
// Generate favicons from assets/img/logo-mark.svg with headless Chromium.
// Run from tools/: node favicons/render.mjs
//
// Writes into static/ (served from the site root, where Blowfish's head.html
// and the browsers' /favicon.ico fallback look for them):
//   favicon.svg, favicon.ico (16 + 32), favicon-16x16.png, favicon-32x32.png,
//   apple-touch-icon.png (180, solid #0B0E14), android-chrome-192x192.png and
//   android-chrome-512x512.png (solid #0B0E14, referenced by site.webmanifest).

import { readFile, writeFile, copyFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const here = dirname(fileURLToPath(import.meta.url));
const src = resolve(here, "../../assets/img/logo-mark.svg");
const out = resolve(here, "../../static");
const bg = "#0B0E14";

// Apple and Android icons get a solid background and some padding, so the
// mark is not clipped by rounded masks; tab favicons stay transparent.
const targets = [
  { file: "favicon-16x16.png", size: 16 },
  { file: "favicon-32x32.png", size: 32 },
  { file: "apple-touch-icon.png", size: 180, bg, pad: 0.12 },
  { file: "android-chrome-192x192.png", size: 192, bg, pad: 0.12 },
  { file: "android-chrome-512x512.png", size: 512, bg, pad: 0.12 },
];

const svg = await readFile(src, "utf8");

const browser = await chromium.launch();
const pngs = {};
try {
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  for (const { file, size, bg: fill = "transparent", pad = 0 } of targets) {
    const inner = Math.round(size * (1 - 2 * pad));
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(
      `<html><body style="margin:0;width:${size}px;height:${size}px;background:${fill};` +
        `display:flex;align-items:center;justify-content:center">` +
        svg.replace("<svg ", `<svg width="${inner}" height="${inner}" `) +
        `</body></html>`,
    );
    const buf = await page.screenshot({ omitBackground: fill === "transparent" });
    await writeFile(resolve(out, file), buf);
    pngs[size] = buf;
    console.log(resolve(out, file));
  }
} finally {
  await browser.close();
}

// ICO container with PNG-encoded 16 and 32 px entries.
const entries = [pngs[16], pngs[32]];
const header = Buffer.alloc(6 + 16 * entries.length);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // type: icon
header.writeUInt16LE(entries.length, 4);
let offset = header.length;
entries.forEach((png, i) => {
  const size = png.readUInt32BE(16); // IHDR width
  const at = 6 + 16 * i;
  header.writeUInt8(size, at);
  header.writeUInt8(size, at + 1);
  header.writeUInt8(0, at + 2); // palette
  header.writeUInt8(0, at + 3); // reserved
  header.writeUInt16LE(1, at + 4); // colour planes
  header.writeUInt16LE(32, at + 6); // bits per pixel
  header.writeUInt32LE(png.length, at + 8);
  header.writeUInt32LE(offset, at + 12);
  offset += png.length;
});
await writeFile(resolve(out, "favicon.ico"), Buffer.concat([header, ...entries]));
console.log(resolve(out, "favicon.ico"));

await copyFile(src, resolve(out, "favicon.svg"));
console.log(resolve(out, "favicon.svg"));
