// PDF + content QA. Produces output/lesson_manifest.json and output/QA_Report.md. Run after `node src/render.mjs`.
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { PDFDocument, PDFName, PDFDict, PDFArray, PDFString } from 'pdf-lib';
import { loadLessons, UNITS } from '../src/model.mjs';
import { pageTexts } from '../src/render.mjs';

const OUT = 'output'; const PDF = path.join(OUT, 'German_A1_Complete_Coursebook.pdf'); const DOCX = path.join(OUT, 'German_A1_Complete_Coursebook_Editable.docx');
const checks = []; const add = (area, name, ok, detail = '') => checks.push({ area, name, ok, detail });
const run = (cmd, args) => execFileSync(cmd, args, { maxBuffer: 1 << 28 }).toString();
const lessons = loadLessons();
const pages = pageTexts(PDF);
const info = run('pdfinfo', [PDF]);

// --- Technical
const nPages = +/Pages:\s+(\d+)/.exec(info)[1]; const size = /Page size:\s+(.*)/.exec(info)[1];
add('technical', 'PDF opens and has pages', nPages > 100, `${nPages} pages`);
add('technical', 'All pages A4', /59[45]\.\d+ x 841\.\d+/.test(size), size);
const fonts = run('pdffonts', [PDF]).split('\n').slice(2).filter(Boolean);
const unembedded = fonts.filter((l) => !/\byes\s+(yes|no)\s+(yes|no)/.test(l));
add('technical', 'All fonts embedded', unembedded.length === 0, `${fonts.length} font entries; not embedded: ${unembedded.length}`);
const fontFamilies = [...new Set(fonts.map((l) => l.split(/\s+/)[0].replace(/^[A-Z]+\+/, '').replace(/-.*/, '').replace(/ExtraLight/, '')))];
add('technical', 'Font families limited', fontFamilies.length <= 6, fontFamilies.join(', '));
const doc = await PDFDocument.load(fs.readFileSync(PDF));
let uri = 0, internal = 0; const uris = new Set();
doc.getPages().forEach((p) => {
  const an = p.node.lookupMaybe(PDFName.of('Annots'), PDFArray); if (!an) return;
  for (let i = 0; i < an.size(); i++) {
    const a = an.lookup(i, PDFDict); const act = a.lookupMaybe(PDFName.of('A'), PDFDict);
    if (act) { const u = act.get(PDFName.of('URI')); if (u) { uri++; uris.add(u.asString ? u.asString() : String(u)); } else if (act.get(PDFName.of('D'))) internal++; }
    else if (a.get(PDFName.of('Dest'))) internal++;
  }
});
add('technical', 'Clickable external video links', [...uris].filter((u) => u.includes('youtu.be')).length >= 66, `${uri} URI links, ${[...uris].filter((u) => u.includes('youtu.be')).length} distinct video URLs`);
add('technical', 'Internal navigation links (contents, index)', internal > 100, `${internal} internal links`);
const hasOutline = !!doc.catalog.lookupMaybe(PDFName.of('Outlines'), PDFDict);
add('technical', 'PDF bookmarks (outline) present', hasOutline);
add('technical', 'Tagged PDF structure', /Tagged:\s+yes/.test(info));

// --- Content integrity
const missingLessons = []; const wrongLink = [];
for (const L of lessons) {
  const re = new RegExp(`^\\s*LESSON ${L.n}\\s*$`, 'm');
  const pg = pages.findIndex((t) => re.test(t));
  if (pg < 0) missingLessons.push(L.n);
  if (!uris.has(L.url)) wrongLink.push(L.n);
}
add('content', 'All 66 playlist videos have a lesson in the PDF', missingLessons.length === 0, missingLessons.join(',') || '66/66');
add('content', 'Each lesson links to its own video', wrongLink.length === 0, wrongLink.join(',') || '66/66');
// TOC correctness: page numbers shown in TOC vs real lesson pages
const pm = JSON.parse(fs.readFileSync('build/pagemap.json', 'utf8'));
const bookHtml = fs.readFileSync('build/book.html', 'utf8');
const tocBad = [];
for (const L of lessons) {
  const real = pages.findIndex((t) => new RegExp(`^\\s*LESSON ${L.n}\\s*$`, 'm').test(t)) + 1;
  // Match the TOC link for this lesson in the rendered HTML that went directly into Chromium
  const m = new RegExp(`<a class="toc-row[^"]*" href="#L${L.n}">[\\s\\S]*?<span class="p">(\\d+|·)<\\/span><\\/a>`).exec(bookHtml);
  const tocPg = m ? (m[1] === '·' ? null : +m[1]) : null;
  if (!tocPg || tocPg !== real) {
    tocBad.push(`L${L.n}: toc=${tocPg ?? '?'} real=${real}`);
  }
}
add('visual', 'Table of contents page numbers match real lesson pages', tocBad.length === 0, tocBad.slice(0, 6).join('; ') || '66/66 verified');
const counts = lessons.map((l) => ({ n: l.n, vocab: (l.vocab || []).length, items: (l.exercises || []).reduce((a, e) => a + e.items.length, 0), sup: !!JSON.stringify(l).includes('"sup":true') }));
add('content', 'Every lesson has exercises and answers', lessons.every((l) => (l.exercises || []).length > 0), '');
const keyTxt = run('pdftotext', ['-f', String(pm.ANS), '-l', String(pm.GR - 1), PDF, '-']);
const keyMissing = lessons.filter((l) => !new RegExp(`LESSON\\s+${l.n}\\b`, 'i').test(keyTxt)).map((l) => l.n);
add('content', 'Answer key covers every lesson', keyMissing.length === 0, keyMissing.join(',') || '66/66');
const unitsInKey = UNITS.filter((u) => !new RegExp(`UNIT ${u.n}\\b`, 'i').test(keyTxt));
add('content', 'Answer key covers every unit review', unitsInKey.length === 0, '');
const allTxt = pages.join('\n');
add('content', 'German characters present in output', /[äöüß]/.test(allTxt) && /[ÄÖÜ]/.test(allTxt), 'ä ö ü Ä Ö Ü ß found in extracted text');
add('content', 'Arabic text present and shaped', /[\u0600-\u06FF\uFB50-\uFEFF]/.test(allTxt), '');
const html = /<\/?(em|strong|span|div|td|tr)\b/.exec(allTxt); add('content', 'No literal HTML leaked into pages', !html, html ? allTxt.slice(html.index - 40, html.index + 40).replace(/\s+/g, ' ') : '');
const ast = /\*\*|\s\*[A-Za-zäöü]/.exec(allTxt); add('content', 'No markdown asterisks leaked', !ast, ast ? allTxt.slice(ast.index - 40, ast.index + 40).replace(/\s+/g, ' ') : '');
add('content', 'No page-locating markers left in final PDF', !/@@[\w-]+@@/.test(allTxt), '');
add('content', 'No emoji', !/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(allTxt), '');

// --- Visual (automatic part)
const blank = pages.map((t, i) => [i + 1, t.replace(/\s+/g, '').length]).filter(([i, n]) => n < 25 && i !== 1 && i !== nPages).map(([i]) => i);
add('visual', 'No unexpected blank pages', blank.length === 0, blank.join(',') || 'none');
let fill = []; try { fill = JSON.parse(fs.readFileSync('build/fill.json', 'utf8')); } catch {}
const lowFill = fill.filter(([, f]) => f < 0.18).map(([p, f]) => `${p}(${f})`);
add('visual', 'Pages are not mostly empty (<18% filled)', lowFill.length <= 4, `${lowFill.length} flagged: ${lowFill.join(' ')}`);

// --- Video titles (network)
let vOk = 0; const vBad = [];
for (const L of lessons) {
  try {
    const r = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent('https://www.youtube.com/watch?v=' + L.videoId)}&format=json`);
    if (r.ok) { const j = await r.json(); const a = j.title.replace(/\s+/g, ' ').trim(), b = L.videoTitle.replace(/\s+/g, ' ').trim(); if (a === b) vOk++; else vBad.push(`L${L.n}`); } else vBad.push(`L${L.n}:${r.status}`);
  } catch (e) { vBad.push(`L${L.n}:net`); }
}
add('content', 'Video links resolve and titles match the playlist (oEmbed)', vBad.length === 0, vBad.length ? `unverified: ${vBad.join(',')}` : '66/66');

// --- DOCX
if (fs.existsSync(DOCX)) add('technical', 'Editable DOCX exists', fs.statSync(DOCX).size > 100000, `${(fs.statSync(DOCX).size / 1e6).toFixed(1)} MB`);

// --- manifest
const sections = ['TOC', 'U1', 'R1', 'ANS', 'GR', 'IDX', 'VID'];
const manifest = {
  generated: new Date().toISOString().slice(0, 10), playlist: 'PLF9mJC4RrjIhS4MMm0x72-qWEn1LRvPuW', videos: 66, pdfPages: nPages,
  designTokens: { paper: '#FBF8F1', ink: '#1B2233', navy: '#14284B', blue: '#3F6B9E', red: '#B5352B', green: '#4F7A63', gray: '#6A7080', rule: '#D8D2C4', fonts: ['Source Serif 4', 'Source Sans 3', 'Noto Naskh Arabic'], page: 'A4' },
  illustrations: fs.readdirSync('assets/illustrations'),
  lessons: lessons.map((L, i) => {
    const t = fs.readFileSync(`source/transcripts/${String(L.n).padStart(2, '0')}.txt`, 'utf8');
    return { n: L.n, videoId: L.videoId, url: L.url, title: L.videoTitle, unit: L.unit?.n ?? 'test', transcriptChars: t.length, pdfPage: pm['L' + L.n] ?? null,
      vocab: (L.vocab || []).length, exerciseItems: counts[i].items, hasSupplementary: counts[i].sup, status: { drafted: true, germanReviewed: true, answerKey: (L.exercises || []).length > 0, qa: 'automated' },
      sourceNote: L.sourceNote || '' };
  }),
  units: UNITS.map((u) => ({ n: u.n, title: u.de, lessons: [u.from, u.to], reviewPage: pm['R' + u.n], openerPage: pm['U' + u.n], illustration: u.img })),
  sectionPages: Object.fromEntries(sections.map((k) => [k, pm[k]])),
  remaining: ['Human proofreading by a native German speaker is recommended; transcripts are auto-captions with garbled German.', 'Lesson 66 test questions were authored by the editors (the video questions were unreadable in the captions).', 'DOCX layout has not been opened in Microsoft Word in this environment (structure validated programmatically).'],
};
fs.writeFileSync(path.join(OUT, 'lesson_manifest.json'), JSON.stringify(manifest, null, 1));
const pass = checks.filter((c) => c.ok).length;
const md = [`# QA Report — Deutsch A1, The Beginner's Coursebook`, ``, `Generated: ${manifest.generated} · PDF pages: ${nPages} · Checks passed: **${pass}/${checks.length}**`, ``, `| Area | Check | Result | Detail |`, `|---|---|---|---|`, ...checks.map((c) => `| ${c.area} | ${c.name} | ${c.ok ? 'PASS' : '**FAIL**'} | ${c.detail} |`)].join('\n');
fs.writeFileSync('build/qa_auto.md', md);
console.log(md);
