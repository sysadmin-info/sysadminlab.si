#!/usr/bin/env node
// Render a 1200x630 Sysadmin Lab cover image with headless Chromium.
//
//   node cover/render.mjs --title "..." [--subtitle "..."] [--log 001]
//                         [--bg path/to/image.jpg] [--out cover.png]
//
// Without --bg the template draws a dark grid placeholder.

import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { chromium } from "playwright";

const here = dirname(fileURLToPath(import.meta.url));

const { values: args } = parseArgs({
  options: {
    title: { type: "string" },
    subtitle: { type: "string", default: "" },
    log: { type: "string", default: "001" },
    bg: { type: "string" },
    out: { type: "string", default: "cover.png" },
    help: { type: "boolean", short: "h" },
  },
});

if (args.help || !args.title) {
  console.error(
    'Usage: node cover/render.mjs --title "Title" [--subtitle "..."] ' +
      "[--log 001] [--bg image.jpg] [--out cover.png]",
  );
  process.exit(args.help ? 0 : 1);
}

// "7" -> "LOG #007"; anything already starting with LOG is kept as-is.
const log = /^log\b/i.test(args.log)
  ? args.log.toUpperCase()
  : `LOG #${args.log.replace(/^#/, "").padStart(3, "0")}`;

const query = new URLSearchParams({ title: args.title, subtitle: args.subtitle, log });

if (args.bg) {
  const bgPath = resolve(args.bg);
  if (!existsSync(bgPath)) {
    console.error(`Background image not found: ${bgPath}`);
    process.exit(1);
  }
  query.set("bg", pathToFileURL(bgPath).href);
}

const templateUrl = `${pathToFileURL(resolve(here, "template.html")).href}?${query}`;
const out = resolve(args.out);

const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
  });
  await page.goto(templateUrl, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: out, type: out.endsWith(".jpg") ? "jpeg" : "png" });
  console.log(`Cover written to ${out}`);
} finally {
  await browser.close();
}
