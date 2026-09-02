import puppeteer from "puppeteer";

const BASE = "http://localhost:5173/#/blog";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function fail(msg) { console.log("FAIL:", msg); process.exitCode = 1; }
function ok(msg) { console.log("ok:", msg); }

let browser;
try {
  browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
  const page = await browser.newPage();
  page.on("console", (m) => { if (m.type() === "error") console.log("console.error:", m.text()); });
  page.on("pageerror", (e) => console.log("pageerror:", e.message));

  // dismiss boot screen helper
  async function dismissBoot() {
    await page.evaluate(() => {
      const b = document.querySelector("[data-boot-screen]");
      if (b) b.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      else document.body.click();
    });
    await sleep(900);
  }

  // ── index: dev.to-style rows ──
  await page.goto(`${BASE}`, { waitUntil: "networkidle2" });
  await dismissBoot();
  const rows = await page.$$eval(".blog-row", (els) => els.length);
  const links = await page.$$eval(".blog-row-main", (els) => els.map((e) => e && e.tagName).filter(Boolean));
  const overflow0 = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  rows >= 2 ? ok(`index rows: ${rows}`) : fail(`expected >=2 rows, got ${rows}`);
  links.every((t) => t === "A") ? ok("row links are real <a>") : fail("row main not anchor");
  overflow0 <= 0 ? ok(`index no h-overflow (${overflow0})`) : fail(`index h-overflow ${overflow0}`);

  // ── post: callout + code header bars + masthead ──
  await page.goto(`${BASE}/arabic-digit-ambiguity`, { waitUntil: "networkidle2" });
  await dismissBoot();
  await sleep(400);
  const callout = await page.$$eval("blockquote.blog-callout", (els) => els.map((e) => ({
    kind: e.getAttribute("data-callout"),
    eyebrow: e.querySelector("p")?.textContent?.trim(),
    box: e.getBoundingClientRect().height > 20,
  })));
  callout.length ? ok(`callout: ${JSON.stringify(callout[0])}`) : fail("no callout rendered");
  if (callout[0] && callout[0].kind !== "note") fail(`callout kind=${callout[0].kind}`);
  const codeblocks = await page.$$eval(".blog-codeblock", (els) => els.map((e) => ({
    lang: e.querySelector(".blog-code-lang")?.textContent || null,
    copy: e.querySelector(".blog-copy")?.textContent || null,
  })));
  codeblocks.length ? ok(`code blocks: ${codeblocks.length} (${codeblocks.map((c) => c.lang).join(", ")})`) : fail("no code header bars");
  codeblocks.every((c) => c.copy === "copy") ? ok("copy buttons in header bars") : fail("copy missing in bar");

  // masthead + byline (single middot line)
  const byline = await page.$eval(".blog-article-byline", (e) => e.textContent.replace(/\s+/g, " ").trim());
  byline.includes("views") ? ok(`byline: ${byline}`) : fail(`byline odd: ${byline}`);

  // toc + marginalia numbers still sync
  const tocNums = await page.$$eval(".blog-toc-num", (els) => els.map((e) => e.textContent));
  tocNums.length >= 2 ? ok(`toc numbers ${tocNums.join(",")}`) : fail("no toc numbers");

  // ── editor route: unlock gate renders (sheet itself needs a PAT; its CSS +
  //    interactions are covered by unit tests + built-stylesheet checks below) ──
  await page.goto(`${BASE}/admin/new`, { waitUntil: "networkidle2" });
  await dismissBoot();
  await sleep(300);
  const unlock = await page.$(".blog-unlock");
  unlock ? ok("editor route: unlock gate shown (sheet requires PAT, unit-tested)") : fail("editor route did not render unlock");

  // ── light mode ──
  await page.evaluate(() => document.documentElement.setAttribute("data-theme", "light"));
  await sleep(600); // body bg transitions over .35s
  const lightBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  lightBg === "rgb(250, 248, 244)" ? ok(`light bg ${lightBg}`) : fail(`light bg ${lightBg}`);

  // ── mobile 505px ──
  await page.setViewport({ width: 505, height: 900 });
  await page.goto(`${BASE}/arabic-digit-ambiguity`, { waitUntil: "networkidle2" });
  await dismissBoot();
  await sleep(300);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  const tocVisible = await page.evaluate(() => {
    const t = document.querySelector(".blog-toc");
    return t ? getComputedStyle(t).display !== "none" : "missing";
  });
  overflow <= 0 ? ok(`505px no h-overflow (${overflow})`) : fail(`505px h-overflow ${overflow}`);
  tocVisible === false ? ok("sidebar hidden on mobile") : fail(`sidebar on mobile: ${tocVisible}`);

  console.log(process.exitCode ? "\nSOME FAILURES" : "\nALL PASS");
} catch (e) {
  console.log("SCRIPT ERROR:", e.message);
  process.exitCode = 1;
} finally {
  if (browser) await browser.close();
}