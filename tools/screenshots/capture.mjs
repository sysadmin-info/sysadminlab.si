#!/usr/bin/env node
// Headless screenshots of the built site (public/) for visual review.
// Run `hugo --gc --minify` first, then: node screenshots/capture.mjs
//
// Serves public/ on a random local port, captures /en/ and /pl/ in dark mode
// at 1440 px (desktop) and 390 px (mobile) into tools/screenshots/.

import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, dirname, extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../../public");

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css",
  ".js": "text/javascript",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".xml": "application/xml",
};

const server = createServer(async (req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, "http://x").pathname));
  let file = join(root, path);
  if (!file.startsWith(root)) {
    res.writeHead(403).end();
    return;
  }
  try {
    if ((await stat(file)).isDirectory()) file = join(file, "index.html");
    res.writeHead(200, { "content-type": types[extname(file)] ?? "application/octet-stream" });
    res.end(await readFile(file));
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((ok) => server.listen(0, "127.0.0.1", ok));
const base = `http://127.0.0.1:${server.address().port}`;

const pages = ["en", "pl"];
const widths = [1440, 390];

const browser = await chromium.launch();
try {
  for (const width of widths) {
    const context = await browser.newContext({
      viewport: { width, height: 900 },
      colorScheme: "dark",
      deviceScaleFactor: 1,
    });
    // External requests would mean a font or asset leaks to a third party.
    context.on("request", (r) => {
      if (!r.url().startsWith(base)) console.warn(`external request: ${r.url()}`);
    });
    const page = await context.newPage();
    for (const lang of pages) {
      await page.goto(`${base}/${lang}/`, { waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts.ready);
      const out = resolve(here, `${lang}-${width}.png`);
      await page.screenshot({ path: out, fullPage: true });
      console.log(`${out}`);
    }
    await context.close();
  }
} finally {
  await browser.close();
  server.close();
}
