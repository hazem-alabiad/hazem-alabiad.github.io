// E2E suite — drives the production build in headless Chrome with Puppeteer.
// Covers the flows a real visitor uses: home load, blog search, post page
// with TOC, the CMS unlock panel, the dedicated editor routes, and no
// horizontal overflow at a mobile viewport.
//
// Run with: pnpm test:e2e  (builds the app first, then runs this script)
import { spawn, execSync } from "node:child_process";
import assert from "node:assert/strict";

const PORT = 4173;
const BASE = `http://127.0.0.1:${PORT}`;

console.log("→ building the app (vite build)…");
execSync("pnpm build", { stdio: "inherit" });

const server = spawn("pnpm", ["exec", "vite", "preview", "--port", String(PORT), "--host", "127.0.0.1", "--strictPort"], { stdio: "ignore" });
let serverCleanup = null;

async function waitUp(url, tries = 40) {
  for (let i = 0; i < tries; i++) {
    try { const r = await fetch(url); if (r.ok) return true; } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

function fail(msg) {
  console.error(`✗ E2E FAILED: ${msg}`);
  cleanup();
  process.exit(1);
}

function cleanup() {
  if (serverCleanup) { serverCleanup(); serverCleanup = null; }
  try { server.kill(); } catch { /* noop */ }
}

process.on("exit", cleanup);

const up = await waitUp(`${BASE}/`);
if (!up) fail("preview server never came up");

import puppeteer from "puppeteer";
const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox", "--disable-setuid-sandbox"] });
serverCleanup = async () => { await browser.close(); };
const page = await browser.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));

try {
  // ── 1. home loads ──
  console.log("→ home…");
  await page.goto(BASE + "/#/", { waitUntil: "domcontentloaded", timeout: 20000 });
  await page.waitForFunction(() => document.body.textContent.includes("H.ALABIAD"), { timeout: 10000 });
  assert.ok(await page.$('a.skip-link'), "skip link missing");
  console.log("  ✓ home renders brand + skip link");

  // ── 2. blog search ──
  console.log("→ blog search…");
  await page.goto(BASE + "/#/blog", { waitUntil: "domcontentloaded", timeout: 20000 });
  await page.waitForSelector(".blog-search-input", { timeout: 15000 });
  await page.type(".blog-search-input", "llm");
  await page.waitForFunction(() => document.querySelector(".blog-search-count")?.textContent?.includes("hit"), { timeout: 8000 });
  const count = await page.$eval(".blog-search-count", (el) => el.textContent);
  assert.ok(/hit/.test(count), `unexpected hit count: ${count}`);
  console.log(`  ✓ search filters: ${count}`);
  await page.keyboard.press("Escape");
  const cleared = await page.$eval(".blog-search-input", (el) => el.value);
  assert.equal(cleared, "", "Escape did not clear the query");
  console.log("  ✓ Escape clears the search");

  // ── 3. post page + TOC ──
  console.log("→ post page & TOC…");
  // the index is a list of real links now (dev.to-style rows); click the first
  await page.$eval(".blog-row-main", (el) => el.click());
  await page.waitForSelector("article.blog-article h1", { timeout: 15000 });
  const title = await page.$eval("article.blog-article h1", (el) => el.textContent);
  assert.ok(title.length > 0, "post title missing");
  await page.waitForFunction(() => document.querySelectorAll(".blog-toc-link").length >= 2, { timeout: 8000 });
  // jump via the TOC
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll(".blog-toc-link")].find((b) => b.textContent.includes("direction"));
    btn?.click();
  });
  await page.waitForFunction(() => {
    const h = document.getElementById("the-direction-i-probe");
    if (!h) return false;
    const r = h.getBoundingClientRect();
    return r.top > 0 && r.top < window.innerHeight;
  }, { timeout: 8000 });
  console.log(`  ✓ post renders (“${title.slice(0, 40)}…”) and TOC jumps to a section`);

  // ── 4. back to blog + CMS unlock panel ──
  console.log("→ CMS unlock panel…");
  await page.$eval(".blog-crumb a", (el) => el.click());
  await page.waitForSelector(".blog-search-input", { timeout: 10000 });
  // the CMS launcher is a fixed button at the bottom of the page; use a DOM
  // click (the same decorative overlay swallows coordinate clicks here too)
  const cmsFound = await page.evaluate(() => {
    const btn = [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "CMS");
    if (!btn) return false;
    btn.click();
    return true;
  });
  assert.ok(cmsFound, "CMS launcher button missing");
  await page.waitForSelector('input[placeholder="GitHub PAT"]', { timeout: 5000 });
  console.log("  ✓ CMS launcher opens the PAT panel");

  // ── 5. dedicated editor route shows the unlock panel without credentials ──
  console.log("→ editor route…");
  await page.goto(BASE + "/#/blog/admin/new", { waitUntil: "domcontentloaded", timeout: 20000 });
  await page.waitForSelector('input[placeholder="GitHub PAT"]', { timeout: 20000 });
  console.log("  ✓ /blog/admin/new requires a PAT (no credentials used)");

  // ── 6. mobile: no horizontal overflow at 505px ──
  console.log("→ mobile overflow check (505px)…");
  await page.setViewport({ width: 505, height: 900 });
  await page.goto(BASE + "/#/blog", { waitUntil: "domcontentloaded", timeout: 20000 });
  await page.waitForSelector(".blog-search-input", { timeout: 15000 });
  const overflow = await page.evaluate(() => ({
    scrollW: document.documentElement.scrollWidth,
    innerW: window.innerWidth,
  }));
  assert.ok(overflow.scrollW <= overflow.innerW, `horizontal overflow: scrollWidth ${overflow.scrollW} > viewport ${overflow.innerW}`);
  console.log(`  ✓ no horizontal overflow (scrollWidth ${overflow.scrollW} ≤ ${overflow.innerW})`);

  assert.equal(errors.length, 0, `page errors during the run: ${errors.join("; ")}`);
  console.log("✓✓ E2E SUITE PASSED — all flows green");
  await browser.close();
  server.kill();
  process.exit(0);
} catch (e) {
  fail(`${e.message}${errors.length ? ` | ${errors.join("; ")}` : ""}`);
}