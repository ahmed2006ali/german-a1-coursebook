// Editable DOCX: real headings, tables, hyperlinks, header/footer page numbers, RTL Arabic runs. No page images.
import fs from 'fs';
import path from 'path';
import * as cheerio from 'cheerio';
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, HeadingLevel, BorderStyle,
  ShadingType, ExternalHyperlink, Header, Footer, PageNumber, TableOfContents, PageBreak, LevelFormat, ImageRun, VerticalAlign,
} from 'docx';
import { ROOT, UNITS, loadLessons, derange, letter, unitOf } from './model.mjs';
import { reviewModel, buildIndex } from './book.mjs';
import { GRAMMAR_REF, selfAssessment } from './matter.mjs';

const NAVY = '14284B', BLUE = '3F6B9E', RED = 'B5352B', GREEN = '4F7A63', GRAY = '6A7080', RULE = 'D8D2C4', TINT = 'F2EEE4';
const SERIF = 'Georgia', SANS = 'Calibri', ARAB = 'Arial';
const strip = (s) => String(s ?? '').replace(/[\u200e\u200f\u202a-\u202e]/g, '');

/** inline markup -> runs ( **bold**, *italic* ) */
function runs(text, o = {}) {
  const out = []; const t = strip(text);
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*)/g; let last = 0; let m;
  const mk = (s, extra = {}) => out.push(new TextRun({ text: s, font: o.font || SANS, size: o.size || 21, color: o.color, bold: o.bold, italics: o.italics, ...extra }));
  while ((m = re.exec(t))) {
    if (m.index > last) mk(t.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith('**')) mk(tok.slice(2, -2), { bold: true }); else mk(tok.slice(1, -1), { italics: true, color: o.color || NAVY });
    last = m.index + tok.length;
  }
  if (last < t.length) mk(t.slice(last));
  return out;
}
const P = (text, o = {}) => new Paragraph({ children: runs(text, o), spacing: { after: o.after ?? 100, before: o.before ?? 0, line: o.line ?? 276 }, alignment: o.align, keepNext: o.keepNext, indent: o.indent });
const arabicP = (text, o = {}) => new Paragraph({ bidirectional: true, alignment: AlignmentType.START, spacing: { after: 80 }, children: [new TextRun({ text: strip(text), font: ARAB, rightToLeft: true, size: o.size || 22, color: o.color || BLUE })] });
const H1 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_1, pageBreakBefore: true, children: [new TextRun({ text: t })] });
const H2 = (t, sub) => new Paragraph({ heading: HeadingLevel.HEADING_2, pageBreakBefore: true, children: [new TextRun({ text: t })] });
const H3 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_3, keepNext: true, children: [new TextRun({ text: t.toUpperCase() })] });
const H4 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_4, keepNext: true, children: runs(t, { font: SERIF, size: 23, bold: true, color: NAVY }) });

const thin = { style: BorderStyle.SINGLE, size: 4, color: RULE };
const none = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
function cell(children, o = {}) {
  return new TableCell({
    children: Array.isArray(children) ? children : [children], width: o.w ? { size: o.w, type: WidthType.PERCENTAGE } : undefined,
    shading: o.fill ? { type: ShadingType.CLEAR, fill: o.fill, color: 'auto' } : undefined, verticalAlign: VerticalAlign.CENTER,
    margins: { top: 50, bottom: 50, left: 80, right: 80 },
    borders: { top: o.noBorder ? none : thin, bottom: thin, left: none, right: none },
  });
}
const cp = (text, o = {}) => new Paragraph({ children: runs(text, { size: 20, ...o }), spacing: { after: 0 }, alignment: o.align });
function table(head, rows, widths, o = {}) {
  const hr = head ? [new TableRow({ tableHeader: true, children: head.map((h, i) => cell(cp(h, { bold: true, color: o.headDark ? 'FFFFFF' : GRAY, size: 17 }), { w: widths?.[i], fill: o.headDark ? NAVY : undefined })) })] : [];
  const br = rows.map((r) => new TableRow({ cantSplit: true, children: r.map((c, i) => cell(c instanceof Paragraph ? c : cp(c), { w: widths?.[i] })) }));
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [...hr, ...br] });
}
const artRuns = (de) => {
  const m = /^(der|die|das)\s+(.*)$/.exec(de);
  if (!m) return [new TextRun({ text: de, font: SANS, size: 20, bold: true, color: NAVY })];
  const col = { der: BLUE, die: RED, das: GREEN }[m[1]];
  return [new TextRun({ text: m[1] + ' ', font: SANS, size: 20, bold: true, color: col }), new TextRun({ text: m[2], font: SANS, size: 20, bold: true, color: NAVY })];
};
const gap = (s) => String(s).replace(/_{2,}/g, '________');

function exerciseBlock(ex, no, label, seed) {
  const out = [];
  out.push(new Paragraph({ keepNext: true, spacing: { before: 160, after: 40 }, children: [new TextRun({ text: `${label || 'Exercise ' + no}  `, font: SANS, size: 17, bold: true, color: RED }), new TextRun({ text: ex.title + (ex.sup ? '  (supplementary)' : ''), font: SERIF, size: 22, bold: true, color: NAVY })] }));
  if (ex.instructions) out.push(P(ex.instructions, { italics: true, color: GRAY, size: 19, after: 60, keepNext: true }));
  if (ex.type === 'match') {
    const n = ex.items.length; const perm = derange(n, seed * 31 + n);
    out.push(table(null, ex.items.map((it, i) => [cp(`${i + 1}  ${it.q}`, { bold: true, color: NAVY }), cp(`${letter(i)}  ${ex.items[perm[i]].a}`)]), [50, 50]));
  } else {
    ex.items.forEach((it, i) => {
      out.push(new Paragraph({ spacing: { after: 40 }, indent: { left: 360, hanging: 360 }, keepLines: true, children: [new TextRun({ text: `${i + 1}.\t`, font: SANS, size: 21, bold: true, color: BLUE }), ...runs(ex.type === 'reorder' ? gap(it.q).split(/\s+\/\s+/).join('  /  ') : gap(it.q))], tabStops: [{ type: 'left', position: 360 }] }));
      if (ex.type === 'reorder' || ex.type === 'translate' || ex.type === 'answer' || (ex.type === 'fill' && !/_{2,}/.test(it.q))) out.push(new Paragraph({ spacing: { after: 80 }, indent: { left: 360 }, border: { bottom: { style: BorderStyle.DOTTED, size: 4, color: 'A9A494', space: 8 } }, children: [new TextRun({ text: ' ', size: 22 })] }));
    });
  }
  return out;
}

function lessonDocx(L) {
  const u = L.unit; const o = [];
  o.push(new Paragraph({ heading: HeadingLevel.HEADING_2, pageBreakBefore: true, bookmark: undefined, children: [new TextRun({ text: `Lesson ${L.n}: ${L.title}` })] }));
  o.push(new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: L.titleDe, font: SERIF, italics: true, size: 28, color: BLUE })] }));
  o.push(new Paragraph({ spacing: { after: 160 }, children: [new TextRun({ text: 'ORIGINAL VIDEO  ', font: SANS, size: 16, bold: true, color: GRAY }), new ExternalHyperlink({ link: L.url, children: [new TextRun({ text: L.url.replace('https://', ''), font: SANS, size: 20, color: BLUE, underline: {} })] })] }));
  if (L.objectives?.length) { o.push(H3('In this lesson you will learn to')); L.objectives.forEach((x) => o.push(new Paragraph({ numbering: { reference: 'box', level: 0 }, spacing: { after: 40 }, children: runs(x) }))); }
  if (L.vocab?.length) {
    o.push(H3('Vocabulary'));
    const hasPl = L.vocab.some((v) => v.pl && v.pl !== '–');
    const head = ['German', ...(hasPl ? ['Plural'] : []), 'English', 'العربية'];
    const w = hasPl ? [30, 22, 28, 20] : [38, 34, 28];
    if (!hasPl) head.splice(2, 0); // keep: German, English, Arabic
    const rows = L.vocab.map((v) => [
      new Paragraph({ spacing: { after: 0 }, children: [...artRuns(v.de), ...(v.sup ? [new TextRun({ text: ' +', size: 16, color: GRAY })] : [])] }),
      ...(hasPl ? [cp(v.pl && v.pl !== '–' ? v.pl : '', { color: NAVY })] : []),
      cp(v.en + (v.note ? ` (${v.note})` : '')),
      new Paragraph({ bidirectional: true, spacing: { after: 0 }, children: [new TextRun({ text: strip(v.ar || ''), font: ARAB, rightToLeft: true, size: 21 })] }),
    ]);
    const heads = hasPl ? ['German', 'Plural', 'English', 'العربية'] : ['German', 'English', 'العربية'];
    o.push(table(heads, rows, hasPl ? [30, 22, 30, 18] : [38, 36, 26]));
  }
  if (L.expressions?.length) {
    o.push(H3('Useful expressions'));
    o.push(table(null, L.expressions.map((v) => [cp(v.de + (v.sup ? ' +' : ''), { bold: true, color: NAVY }), cp(v.en), new Paragraph({ bidirectional: true, spacing: { after: 0 }, children: [new TextRun({ text: strip(v.ar || ''), font: ARAB, rightToLeft: true, size: 21 })] })]), [36, 46, 18]));
  }
  if (L.patterns?.length) {
    o.push(H3('Sentence patterns'));
    L.patterns.forEach((p) => o.push(new Paragraph({ spacing: { after: 80 }, shading: { type: ShadingType.CLEAR, fill: TINT, color: 'auto' }, border: { left: { style: BorderStyle.SINGLE, size: 18, color: RED, space: 8 } }, indent: { left: 140 }, keepLines: true, children: [...runs(p.form, { bold: true, color: NAVY }), new TextRun({ text: '\n', break: 1 }), ...runs(p.ex, { bold: true, color: NAVY }), ...runs('  ·  ' + p.en, { color: GRAY })] })));
  }
  if (L.grammar?.length) {
    o.push(H3('Grammar'));
    for (const g of L.grammar) {
      o.push(H4(g.title + (g.sup ? '  +' : '')));
      String(g.body).split(/\n\s*\n/).forEach((para) => o.push(P(para)));
      if (g.ar) o.push(arabicP(g.ar));
      if (g.table?.head) o.push(table(g.table.head.map((h) => strip(h).replace(/\*/g, '')), g.table.rows.map((r) => r.map((c) => cp(strip(c).replace(/\*/g, '')))), undefined, { headDark: true }));
      if (g.examples?.length) o.push(table(null, g.examples.map((e) => [cp(e.de + (e.sup ? ' +' : ''), { bold: true, color: NAVY }), cp(e.en, { color: GRAY })]), [50, 50]));
      o.push(P('', { after: 60 }));
    }
  }
  if (L.mistakes?.length) { o.push(H3('Common mistakes')); o.push(table(['Not', 'Say', 'Why'], L.mistakes.map((m) => [new Paragraph({ children: [new TextRun({ text: strip(m.wrong).replace(/\*/g, ''), strike: true, color: RED, font: SANS, size: 20 })], spacing: { after: 0 } }), cp(strip(m.right).replace(/\*/g, ''), { bold: true, color: NAVY }), cp(strip(m.why).replace(/\*/g, ''))]), [30, 30, 40])); }
  if (L.pronunciation?.length) { o.push(H3('Pronunciation')); o.push(table(null, L.pronunciation.map((p) => [cp(p.de, { bold: true, color: NAVY, size: 24, font: SERIF }), cp(strip(p.tip))]), [18, 82])); }
  if (L.dialogues?.length) {
    o.push(H3('Dialogues'));
    for (const d of L.dialogues) { o.push(H4(d.title + (d.sup ? '  +' : ''))); o.push(table(null, d.lines.map((l) => [cp(l.who, { bold: true, color: RED, size: 17 }), cp(l.de, { bold: true, color: NAVY }), cp(l.en, { color: GRAY })]), [6, 47, 47])); o.push(P('', { after: 60 })); }
  }
  if (L.tip) o.push(new Paragraph({ spacing: { before: 100, after: 100 }, shading: { type: ShadingType.CLEAR, fill: 'E6ECF3', color: 'auto' }, border: { left: { style: BorderStyle.SINGLE, size: 16, color: BLUE, space: 8 } }, indent: { left: 140 }, children: [new TextRun({ text: 'TIP   ', font: SANS, size: 16, bold: true, color: BLUE }), ...runs(L.tip)] }));
  if (L.comprehension?.length) { o.push(H3('Check your understanding')); L.comprehension.forEach((c, i) => { o.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: `${i + 1}.  `, bold: true, color: RED, font: SANS, size: 21 }), ...runs(c.q)] })); o.push(new Paragraph({ spacing: { after: 80 }, border: { bottom: { style: BorderStyle.DOTTED, size: 4, color: 'A9A494', space: 6 } }, children: [new TextRun({ text: ' ', size: 22 })] })); }); }
  if (L.exercises?.length) { o.push(H3(L.n === 66 ? 'The test' : 'Practice')); L.exercises.forEach((ex, i) => o.push(...exerciseBlock(ex, i + 1, null, L.n * 10 + i))); }
  if (L.summary?.length) { o.push(H3('In a nutshell')); L.summary.forEach((s) => o.push(new Paragraph({ numbering: { reference: 'bul', level: 0 }, spacing: { after: 40 }, children: runs(s) }))); }
  return o;
}

function keyDocx(lessons) {
  const o = [new Paragraph({ heading: HeadingLevel.HEADING_1, pageBreakBefore: true, children: [new TextRun({ text: 'Answer Key' })] }), P('Answers and short explanations for every comprehension question, exercise and review, in lesson order.', { italics: true, color: GRAY })];
  const ansLines = (ex, seed) => {
    if (ex.type === 'match') { const n = ex.items.length; const perm = derange(n, seed * 31 + n); return [P(ex.items.map((it, j) => `${j + 1}–${letter(perm.indexOf(j))}`).join('   '), { bold: true, color: NAVY, after: 40 })]; }
    return ex.items.map((i, k) => new Paragraph({ spacing: { after: 20 }, indent: { left: 360, hanging: 360 }, children: [new TextRun({ text: `${k + 1}.\t`, font: SANS, size: 19, color: GRAY }), ...runs(i.a, { bold: true, color: NAVY, size: 19 }), ...(i.expl ? runs('  — ' + i.expl, { color: GRAY, size: 17 }) : [])], tabStops: [{ type: 'left', position: 360 }] }));
  };
  for (const u of UNITS) {
    for (const L of lessons.filter((l) => l.n >= u.from && l.n <= u.to)) o.push(...oneKey(L, ansLines));
    const m = reviewModel(u, lessons);
    o.push(H4(`Unit ${u.n} · Revision: ${u.de}`));
    o.push(P('A · Vocabulary recall', { bold: true, color: BLUE, size: 18, after: 30 }));
    m.vocab.forEach((v, i) => o.push(P(`${i + 1}. ${v.de}${v.pl && v.pl !== '–' ? ' · ' + v.pl : ''}`, { size: 19, after: 10 })));
    [['B', m.unit], ['C', m.look], ['D', m.cumulative]].forEach(([k, bl]) => bl.forEach((b) => { o.push(P(`${k} · Lesson ${b.lesson} · ${b.ex.title}`, { bold: true, color: BLUE, size: 18, before: 60, after: 30 })); o.push(...ansLines(b.ex, 500 + b.lesson)); }));
  }
  o.push(...oneKey(lessons[65], ansLines));
  return o;
}
function oneKey(L, ansLines) {
  const o = [H4(`Lesson ${L.n}: ${L.title}`)];
  if (L.comprehension?.length) { o.push(P('Check your understanding', { bold: true, color: BLUE, size: 18, after: 30 })); L.comprehension.forEach((c, i) => o.push(P(`${i + 1}. ${c.a}`, { size: 19, after: 10 }))); }
  (L.exercises || []).forEach((ex, i) => { o.push(P(`Exercise ${i + 1} · ${ex.title}`, { bold: true, color: BLUE, size: 18, before: 60, after: 30 })); o.push(...ansLines(ex, L.n * 10 + i)); });
  return o;
}

function grammarRefDocx() {
  const $ = cheerio.load(GRAMMAR_REF(), null, false); const o = [new Paragraph({ heading: HeadingLevel.HEADING_1, pageBreakBefore: true, children: [new TextRun({ text: 'Grammar Reference' })] }), P('Supplementary: compiled by the editors.', { italics: true, color: GRAY })];
  const txt = (el) => $(el).text().replace(/\s+/g, ' ').trim();
  $('.gr > section').each((_, s) => {
    $(s).children().each((__, el) => {
      const $el = $(el);
      if (el.tagName === 'h3') o.push(H3(txt(el)));
      else if ($el.is('p.note')) o.push(P(txt(el)));
      else if ($el.is('.formula')) o.push(new Paragraph({ spacing: { after: 80 }, shading: { type: ShadingType.CLEAR, fill: TINT, color: 'auto' }, border: { left: { style: BorderStyle.SINGLE, size: 18, color: RED, space: 8 } }, indent: { left: 140 }, children: [new TextRun({ text: txt(el), font: SANS, size: 20, color: NAVY })] }));
      else if ($el.is('table')) o.push(htmlTable($, el));
      else if ($el.is('.two')) $el.find('table').each((___, t) => { o.push(htmlTable($, t)); o.push(P('', { after: 40 })); });
      else if ($el.is('.v2')) {
        const rows = []; $el.find('.row').each((___, r) => rows.push($(r).children().map((____, c) => txt(c)).get()));
        o.push(table(rows[0], rows.slice(1).map((r) => r.map((c) => cp(c))), [22, 18, 18, 22, 20], { headDark: true }));
      }
    });
  });
  return o;
}
function htmlTable($, t) {
  const head = $(t).find('thead th').map((_, c) => $(c).text().trim()).get();
  const rows = $(t).find('tbody tr').map((_, r) => [$(r).children('td').map((__, c) => cp($(c).text().trim())).get()]).get();
  return table(head, rows, undefined, { headDark: true });
}

function indexDocx(lessons) {
  const list = buildIndex(lessons);
  const o = [new Paragraph({ heading: HeadingLevel.HEADING_1, pageBreakBefore: true, children: [new TextRun({ text: 'Vocabulary Index' })] }), P(`${list.length} words and phrases, alphabetical, with the lessons where they appear.`, { italics: true, color: GRAY })];
  o.push(table(['German', 'Plural', 'English', 'Lessons'], list.map((e) => [new Paragraph({ spacing: { after: 0 }, children: artRuns(e.de) }), cp(e.pl && e.pl !== '–' ? e.pl : '', { color: NAVY }), cp(e.en), cp(e.lessons.join(', '), { color: BLUE })]), [32, 24, 32, 12]));
  return o;
}

export async function buildDocx(outFile) {
  const lessons = loadLessons(); const kids = [];
  // Title page
  kids.push(new Paragraph({ spacing: { before: 3200, after: 120 }, children: [new TextRun({ text: 'Deutsch A1', font: SERIF, bold: true, size: 100, color: NAVY })] }));
  kids.push(new Paragraph({ spacing: { after: 240 }, children: [new TextRun({ text: "The Beginner's Coursebook", font: SERIF, italics: true, size: 40, color: BLUE })] }));
  kids.push(new Paragraph({ spacing: { after: 400 }, border: { top: { style: BorderStyle.SINGLE, size: 24, color: RED, space: 12 } }, children: [new TextRun({ text: 'A practical learning companion with vocabulary, sentence patterns, grammar, exercises, and revision.', font: SANS, size: 24 })] }));
  kids.push(P('Editable edition. This Word document contains the full text of the coursebook (65 lessons, a final test, answer key, grammar reference and vocabulary index) and links each lesson to its original video. It is an independent study companion built on the free video series “A1 (Free Course) – Learn German for beginners” by the channel Learn German. Material marked + or “supplementary” was added by the editors.', { color: GRAY, size: 19 }));
  kids.push(P('To build the table of contents, open the document in Word and press F9 (or choose “Update field”).', { color: GRAY, size: 19, italics: true }));
  kids.push(new Paragraph({ children: [new PageBreak()] }));
  kids.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: 'Contents' })] }));
  kids.push(new TableOfContents('Contents', { hyperlink: true, headingStyleRange: '1-2' }));
  // Welcome
  kids.push(H1('Welcome')); 
  ['This book turns the A1 video course into something you can study with a pencil. Each lesson gives you the vocabulary, patterns and grammar of the video, exercises to write in, and an answer key at the back.', 'Study routine: watch the video once; read the lesson; cover the English column and recall every word; do the exercises without looking back and check the Answer Key; read the dialogues aloud; do the unit review a few days after finishing the unit.', 'Colours: der (blue), die (red), das (green). Unmarked content comes from the video; + marks supplementary material added by the editors.'].forEach((t) => kids.push(P(t)));
  for (const u of UNITS) {
    kids.push(H1(`Unit ${u.n}: ${u.de}`));
    kids.push(P(u.en, { italics: true, color: BLUE, size: 26, font: SERIF }));
    kids.push(P(u.blurb));
    const img = path.join(ROOT, 'assets/illustrations', u.img);
    if (fs.existsSync(img)) kids.push(new Paragraph({ spacing: { after: 160 }, children: [new ImageRun({ type: 'jpg', data: fs.readFileSync(img), transformation: { width: 420, height: 315 }, altText: { title: u.en, description: `Illustration for unit ${u.n}: ${u.en}`, name: u.img } })] }));
    for (const L of lessons.filter((l) => l.n >= u.from && l.n <= u.to)) kids.push(...lessonDocx(L));
    // review
    const m = reviewModel(u, lessons);
    kids.push(H2(`Unit ${u.n} Revision: ${u.de}`));
    kids.push(P('Answer from memory first, then check the Answer Key.', { italics: true, color: GRAY }));
    kids.push(H3('A · Vocabulary recall'));
    kids.push(table(['English', 'German (with article)'], m.vocab.map((v, i) => [cp(`${i + 1}.  ${v.en}  (L${v.L})`), cp('')]), [45, 55]));
    kids.push(H3('B · This unit')); m.unit.forEach((b) => kids.push(...exerciseBlock(b.ex, 0, `Lesson ${b.lesson}`, 500 + b.lesson)));
    if (m.look.length) { kids.push(H3('C · Look back')); m.look.forEach((b) => kids.push(...exerciseBlock(b.ex, 0, `Lesson ${b.lesson}`, 500 + b.lesson))); }
    if (m.cumulative.length) { kids.push(H3('D · Cumulative review')); m.cumulative.forEach((b) => kids.push(...exerciseBlock(b.ex, 0, `Lesson ${b.lesson}`, 500 + b.lesson))); }
    kids.push(H3('Can you do it?'));
    lessons.filter((l) => l.n >= u.from && l.n <= u.to).forEach((l) => (l.objectives || []).slice(0, 2).forEach((x) => kids.push(new Paragraph({ numbering: { reference: 'box', level: 0 }, spacing: { after: 30 }, children: runs(`${x}  (L${l.n})`, { size: 19 }) }))));
  }
  kids.push(H1('Test Your German')); kids.push(...lessonDocx(lessons[65]).slice(1));
  kids.push(H2('Final Self-assessment'));
  kids.push(table(['Test score (lesson 66, 30 items)', 'What it means'], [['26–30', 'Excellent. You are ready to begin A2.'], ['20–25', 'Good. Revise the units where you missed items.'], ['12–19', 'Solid base. Redo the weakest unit reviews, retake the test in two weeks.'], ['0–11', 'Return to Unit 1 and repeat the study routine; re-watch each video once.']].map((r) => r.map((c) => cp(c))), [30, 70], { headDark: true }));
  UNITS.forEach((u) => { kids.push(H4(`Unit ${u.n} · ${u.de}`)); lessons.filter((l) => l.n >= u.from && l.n <= u.to).forEach((l) => (l.objectives || []).slice(0, 2).forEach((x) => kids.push(new Paragraph({ numbering: { reference: 'box', level: 0 }, spacing: { after: 30 }, children: runs(x, { size: 19 }) })))); });
  kids.push(...keyDocx(lessons));
  kids.push(...grammarRefDocx());
  kids.push(...indexDocx(lessons));
  const doc = new Document({
    creator: 'Deutsch A1 coursebook', title: "Deutsch A1 — The Beginner's Coursebook", description: 'Editable edition', features: { updateFields: false },
    styles: {
      default: { document: { run: { font: SANS, size: 21 } } },
      paragraphStyles: [
        { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: SERIF, size: 52, bold: true, color: NAVY }, paragraph: { spacing: { before: 0, after: 160 }, keepNext: true, outlineLevel: 0 } },
        { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: SERIF, size: 44, bold: true, color: NAVY }, paragraph: { spacing: { before: 0, after: 80 }, keepNext: true, outlineLevel: 1, border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: NAVY, space: 6 } } } },
        { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: SANS, size: 17, bold: true, color: NAVY, characterSpacing: 40 }, paragraph: { spacing: { before: 280, after: 100 }, keepNext: true, outlineLevel: 2, border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: NAVY, space: 3 } } } },
        { id: 'Heading4', name: 'Heading 4', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: SERIF, size: 23, bold: true, color: NAVY }, paragraph: { spacing: { before: 160, after: 60 }, keepNext: true, outlineLevel: 3 } },
      ],
    },
    numbering: { config: [
      { reference: 'box', levels: [{ level: 0, format: LevelFormat.BULLET, text: '☐', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 400, hanging: 300 } }, run: { color: BLUE } } }] },
      { reference: 'bul', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 400, hanging: 250 } }, run: { color: RED } } }] },
    ] },
    sections: [{
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1300, bottom: 1200, left: 1300, right: 1100 } } },
      headers: { default: new Header({ children: [new Paragraph({ children: [new TextRun({ text: "DEUTSCH A1 · THE BEGINNER'S COURSEBOOK", font: SANS, size: 14, color: GRAY, characterSpacing: 30 })] })] }) },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: [PageNumber.CURRENT], font: SANS, size: 18, color: NAVY })] })] }) },
      children: kids,
    }],
  });
  const buf = await Packer.toBuffer(doc); fs.writeFileSync(outFile, buf); return outFile;
}
if (process.argv[1] === new URL(import.meta.url).pathname) {
  const f = path.join(ROOT, 'output/German_A1_Complete_Coursebook_Editable.docx');
  fs.mkdirSync(path.dirname(f), { recursive: true });
  await buildDocx(f); console.log('DOCX:', f, fs.statSync(f).size);
}
