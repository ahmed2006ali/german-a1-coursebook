// Two-pass HTML -> PDF render with Chromium (Playwright). Pass 1 locates section pages for the table of contents.
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { chromium } from 'playwright-core';
import { ROOT } from './model.mjs';
import { buildHtml } from './book.mjs';

const CHROME = process.env.CHROME_PATH || path.join(process.env.HOME, '.cache/ms-playwright/chromium-1243/chrome-linux64/chrome');
const OUT = path.join(ROOT, 'output');
const BUILD = path.join(ROOT, 'build');
fs.mkdirSync(OUT, { recursive: true }); fs.mkdirSync(BUILD, { recursive: true });

async function renderPdf(browser, htmlFile, pdfFile) {
  const page = await browser.newPage();
  await page.goto('file://' + htmlFile, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.emulateMedia({ media: 'print' });
  const overflow = await page.evaluate(() => {
    const bad = [];
    document.querySelectorAll('.lesson *, .review *, .key *, .gr *').forEach((el) => {
      const cs = getComputedStyle(el);
      if (cs.display === 'inline' || el.closest('.mk')) return;
      if (el.scrollWidth > el.clientWidth + 2 && cs.overflow !== 'visible') bad.push(el.className || el.tagName);
    });
    return bad.slice(0, 20);
  });
  await page.pdf({ path: pdfFile, preferCSSPageSize: true, printBackground: true, outline: true, tagged: true, displayHeaderFooter: false });
  await page.close();
  return overflow;
}

export function pageTexts(pdf) {
  const txt = execFileSync('pdftotext', ['-layout', pdf, '-'], { maxBuffer: 1 << 28 }).toString('utf8');
  const pages = txt.split('\f'); if (pages[pages.length - 1].trim() === '') pages.pop();
  return pages;
}

export async function build({ pdfName = 'German_A1_Complete_Coursebook.pdf' } = {}) {
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  try {
    // pass 1: markers, placeholder TOC
    const h1 = path.join(BUILD, 'book_pass1.html');
    fs.writeFileSync(h1, buildHtml({ markers: true }));
    const p1 = path.join(BUILD, 'pass1.pdf');
    await renderPdf(browser, h1, p1);
    const pages = pageTexts(p1);
    const pageMap = {};
    pages.forEach((t, i) => { for (const m of t.matchAll(/@@([\w-]+)@@/g)) if (pageMap[m[1]] == null) pageMap[m[1]] = i + 1; });
    // pass 2: final
    const h2 = path.join(BUILD, 'book.html');
    fs.writeFileSync(h2, buildHtml({ markers: false, pageMap }));
    const out = path.join(OUT, pdfName);
    const overflow = await renderPdf(browser, h2, out);
    fs.writeFileSync(path.join(BUILD, 'pagemap.json'), JSON.stringify(pageMap, null, 1));
    return { out, pageMap, pass1Pages: pages.length, overflow };
  } finally { await browser.close(); }
}
if (process.argv[1] === new URL(import.meta.url).pathname) {
  const r = await build();
  console.log('PDF:', r.out, 'pass1 pages:', r.pass1Pages, 'overflow:', r.overflow);
}
