import { chromium } from "playwright-core";
import fs from "fs";

const exe = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const outDir = process.argv[2] || "/tmp/shots";
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({
  executablePath: exe,
  args: ["--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
page.on("console", (m) => { if (m.type() === "error") console.log("PAGE ERR:", m.text()); });
page.on("pageerror", (e) => console.log("PAGE EXCEPTION:", e.message));

await page.goto("http://localhost:4173/", { waitUntil: "networkidle" });
await page.waitForTimeout(4500); // let loader + hero intro finish

const shots = [
  ["hero", "#hero", 0],
  ["problem", "#problem", -80],
  ["solution", "#solution", -60],
  ["services", "#services", -60],
  ["pricing", "#pricing", -60],
  ["faq", "#faq", -60],
  ["cta", "#start", -40],
  ["footer", ".footer", -200],
];

for (const [name, sel, off] of shots) {
  await page.evaluate(([sel, off]) => {
    const el = document.querySelector(sel);
    window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY + off);
  }, [sel, off]);
  await page.waitForTimeout(1600);
  await page.screenshot({ path: `${outDir}/${name}.png` });
  console.log("shot", name);
}

// process section: scroll into the pin and partway through
await page.evaluate(() => {
  const el = document.querySelector("#process");
  window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY + 10);
});
await page.waitForTimeout(1200);
await page.screenshot({ path: `${outDir}/process-start.png` });
await page.evaluate(() => window.scrollBy(0, 900));
await page.waitForTimeout(1200);
await page.screenshot({ path: `${outDir}/process-mid.png` });
console.log("shot process");

// mobile pass
await page.setViewportSize({ width: 390, height: 844 });
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(1500);
await page.screenshot({ path: `${outDir}/mobile-hero.png` });
await page.evaluate(() => { const el = document.querySelector("#pricing"); window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY); });
await page.waitForTimeout(1300);
await page.screenshot({ path: `${outDir}/mobile-pricing.png` });
console.log("shot mobile");

await browser.close();
