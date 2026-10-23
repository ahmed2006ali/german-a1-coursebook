// Builds the full book HTML from content/lessons/*.json.
import fs from 'fs';
import path from 'path';
import { ROOT, UNITS, loadLessons, esc, md, mdParas, strip, artHtml, derange, shuffled, letter, unitOf } from './model.mjs';
import { titlePage, welcome, GRAMMAR_REF, selfAssessment } from './matter.mjs';

const css = fs.readFileSync(path.join(ROOT, 'src/book.css'), 'utf8');
const supTag = (o) => (o && o.sup ? '<span class="sup">+</span>' : '');
const chip = (o) => (o && o.sup ? '<span class="chip">Supplementary</span>' : '');
const mk = (opts, key) => (opts.markers ? `<span class="mk" style="position:absolute;font-size:2px;line-height:1;color:#FBF8F1">@@${key}@@</span>` : '');
const pgOf = (opts, key) => (opts.pageMap && opts.pageMap[key] != null ? opts.pageMap[key] : '·');

/* ---------- exercise item rendering ------------------------------------- */
function renderQ(type, q) {
  let s = esc(q);
  s = s.replace(/_{2,}/g, '<span class="gap"></span>');
  s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>');
  if (type === 'choose') s = s.replace(/\(([^()]*\/[^()]*)\)\s*$/, '<span class="opts">($1)</span>');
  if (type === 'reorder') s = `<span class="words">${s.split(/\s+\/\s+/).join('<i>/</i>')}</span>`;
  return s;
}
const needsLine = (type, q) => type === 'reorder' || type === 'translate' || type === 'answer' || (type === 'fill' && !/_{2,}/.test(q));
const shortItems = (ex) => ex.items.every((i) => i.q.length < 46) && ex.type !== 'reorder' && ex.type !== 'translate' && ex.type !== 'answer' && !(ex.type === 'fill' && ex.items.some((i) => !/_{2,}/.test(i.q)));

export function renderExercise(ex, no, opts = {}) {
  const head = `<div class="eh"><span class="no">${opts.label || 'Exercise ' + no}</span><span class="tt">${esc(ex.title)}</span>${supTagLabel(ex)}</div>
    ${ex.instructions ? `<p class="ins">${md(ex.instructions)}</p>` : ''}`;
  if (ex.type === 'match') {
    const n = ex.items.length;
    const perm = derange(n, (opts.seed || 1) * 31 + n);
    const rows = ex.items.map((it, i) => `<tr><td class="l"><b>${i + 1}</b>${md(it.q)}</td><td class="r"><b>${letter(i)}</b>${md(ex.items[perm[i]].a)}</td></tr>`).join('');
    return `<div class="ex match${opts.last ? ' last-ex' : ''}">${head}<table>${rows}</table></div>`;
  }
  const two = shortItems(ex) && ex.items.length >= 4;
  const lis = ex.items.map((it) => `<li>${renderQ(ex.type, it.q)}${needsLine(ex.type, it.q) ? '<span class="wl"></span>' : ''}</li>`).join('');
  return `<div class="ex${opts.last ? ' last-ex' : ''}">${head}<ol class="${two ? 'cols2' : ''}">${lis}</ol></div>`;
}
function supTagLabel(ex) { return ex.sup ? '<span class="sup" style="margin-left:auto">Supplementary</span>' : ''; }

/** Answer text for a match exercise (number -> letter) following renderExercise's shuffle. */
function matchKey(ex, seed) {
  const n = ex.items.length; const perm = derange(n, seed * 31 + n);
  // right column position i shows item perm[i]; so item j's letter is the i where perm[i]===j
  return ex.items.map((it, j) => `${j + 1}–${letter(perm.indexOf(j))}`).join('  ');
}

/* ---------- lesson ------------------------------------------------------ */
function sec(title, inner, extra = '') { return `<div class="sh">${esc(title)}${extra}</div>${inner}`; }

export function renderLesson(L, opts) {
  const u = L.unit; const o = [];
  const n2 = String(L.n);
  o.push(`<article class="lesson" id="L${L.n}" style="page:L${L.n}">${mk(opts, 'L' + L.n)}`);
  o.push(`<header class="lh"><div class="meta"><span>Lesson ${L.n}</span></div>
    <h2>${esc(L.title)}</h2><div class="de-t">${esc(L.titleDe)}</div>
    <div class="vid"><span class="vlabel">Original video</span><a href="${L.url}">${L.url.replace('https://', '')}</a></div></header>`);
  if (L.objectives?.length) o.push(sec('In this lesson you will learn to', `<ul class="obj">${L.objectives.map((x) => `<li>${md(x)}</li>`).join('')}</ul>`));

  if (L.vocab?.length) {
    const hasPl = L.vocab.some((v) => v.pl && v.pl !== '–');
    const hasAr = L.vocab.some((v) => v.ar);
    const rows = L.vocab.map((v) => `<tr><td class="w">${artHtml(v.de)}${supTag(v)}</td>${hasPl ? `<td class="pl">${v.pl && v.pl !== '–' ? esc(v.pl) : (v.pl === '–' ? '<span style="color:#9aa">–</span>' : '')}</td>` : ''}<td class="en">${esc(v.en)}${v.note ? ` <span style="color:#6A7080;font-size:8.4pt">(${esc(v.note)})</span>` : ''}</td>${hasAr ? `<td class="ar">${esc(v.ar || '')}</td>` : ''}</tr>`).join('');
    o.push(sec('Vocabulary', `<table class="vt"><thead><tr><th>German</th>${hasPl ? '<th>Plural</th>' : ''}<th>English</th>${hasAr ? '<th class="ar" style="text-align:right;font-size:9pt">العربية</th>' : ''}</tr></thead><tbody>${rows}</tbody></table>`));
  }
  if (L.expressions?.length) {
    const hasAr = L.expressions.some((v) => v.ar);
    const rows = L.expressions.map((v) => `<tr><td class="w">${esc(v.de)}${supTag(v)}</td><td class="en">${esc(v.en)}</td>${hasAr ? `<td class="ar">${esc(v.ar || '')}</td>` : ''}</tr>`).join('');
    o.push(sec('Useful expressions', `<table class="vt et"><tbody>${rows}</tbody></table>`));
  }
  if (L.patterns?.length) {
    o.push(sec('Sentence patterns', `<div class="patterns">${L.patterns.map((p) => `<div class="pat"><div class="f">${md(p.form)}</div><div class="x"><span class="de">${md(p.ex)}</span> <span class="en">· ${md(p.en)}</span></div></div>`).join('')}</div>`));
  }
  if (L.grammar?.length) {
    o.push(sec('Grammar', ''));
    for (const g of L.grammar) {
      let h = `<div class="gb"><h4>${md(g.title)}${supTag(g)}</h4>${mdParas(g.body)}`;
      if (g.ar) h += `<span class="ar">${esc(g.ar)}</span>`;
      if (g.table?.head) {
        h += `<table class="gt"><thead><tr>${g.table.head.map((c) => `<th>${md(c)}</th>`).join('')}</tr></thead><tbody>${g.table.rows.map((r) => `<tr>${r.map((c) => `<td>${md(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
      }
      if (g.examples?.length) h += `<ul class="exl">${g.examples.map((e) => `<li><span class="d">${md(e.de)}${supTag(e)}</span><span class="e">${md(e.en)}</span></li>`).join('')}</ul>`;
      o.push(h + '</div>');
    }
  }
  if (L.mistakes?.length) {
    o.push(sec('Common mistakes', `<div class="mistwrap"><div class="mist"><div class="hd">Not</div><div class="hd">Say</div><div class="hd">Why</div>${L.mistakes.map((m) => `<div class="no">${md(m.wrong)}</div><div class="yes">${md(m.right)}</div><div class="why">${md(m.why)}</div>`).join('')}</div></div>`));
  }
  if (L.pronunciation?.length) {
    o.push(sec('Pronunciation', `<table class="pt"><tbody>${L.pronunciation.map((p) => `<tr><td>${esc(p.de)}</td><td>${md(p.tip)}</td></tr>`).join('')}</tbody></table>`));
  }
  if (L.dialogues?.length) {
    const sup = L.dialogues.every((d) => d.sup);
    o.push(sec('Dialogues', L.dialogues.map((d) => `<div class="dlg"><h5>${esc(d.title)}${supTag(d)}</h5><table><tbody>${d.lines.map((l) => `<tr><td class="who">${esc(l.who)}</td><td class="d">${md(l.de)}</td><td class="e">${md(l.en)}</td></tr>`).join('')}</tbody></table></div>`).join(''), sup ? chip({ sup: true }) : ''));
  }
  if (L.tip) o.push(`<div class="tipbox"><div class="l">Tip</div><div class="b">${md(L.tip)}</div></div>`);
  if (L.comprehension?.length) {
    o.push(sec('Check your understanding', `<ol class="cq">${L.comprehension.map((c) => `<li>${md(c.q)}<span class="wl"></span></li>`).join('')}</ol>`));
  }
  if (L.exercises?.length) {
    o.push(sec(L.n === 66 ? 'The test' : 'Practice', ''));
    L.exercises.forEach((ex, i) => o.push(renderExercise(ex, i + 1, { seed: L.n * 10 + i, last: i === L.exercises.length - 1 && !!L.summary?.length })));
  }
  if (L.summary?.length) o.push(`<div class="summary"><h4>In a nutshell</h4><ul>${L.summary.map((s) => `<li>${md(s)}</li>`).join('')}</ul></div>`);
  o.push('</article>');
  return o.join('\n');
}

/* ---------- unit opener & review --------------------------------------- */
export function renderOpener(u, lessons, opts) {
  const ls = lessons.filter((l) => l.n >= u.from && l.n <= u.to);
  const goals = ls.flatMap((l) => (l.objectives || []).slice(0, 1));
  return `<section class="opener" id="U${u.n}" style="page:opener">${mk(opts, 'U' + u.n)}
    <div class="plate"><img src="../assets/illustrations/${u.img}" alt=""></div>
    <div class="body"><div class="ulabel">Unit ${u.n} · Lessons ${u.from}–${u.to}</div><h2>${esc(u.de)}</h2><div class="ue">${esc(u.en)}</div>
    <p class="blurb">${esc(u.blurb)}</p>
    <div class="cols"><div><h4>Lessons</h4><ol class="ll">${ls.map((l) => `<li><b>${l.n}</b><span>${esc(l.title)}</span></li>`).join('')}</ol></div>
    <div><h4>By the end you can</h4><ul class="cd">${goals.slice(0, 8).map((g) => `<li>${md(g)}</li>`).join('')}</ul></div></div></div></section>`;
}

const EX_TYPES_OK = new Set(['fill', 'choose', 'translate', 'reorder', 'answer']);
function exBlocks(lessonList, perLesson, seed, offset = 0) {
  // one block (up to perLesson items) from each lesson; rotating over its exercises
  const blocks = [];
  lessonList.forEach((L, idx) => {
    const cands = (L.exercises || []).filter((e) => EX_TYPES_OK.has(e.type) && e.items.length >= 3 && e.items.every((i) => i.q.length < 130 && i.a.length < 130) && !(e.type === 'fill' && e.items.some((i) => !/_{2,}/.test(i.q))));
    if (!cands.length) return;
    const ex = cands[(idx + offset) % cands.length];
    const start = (seed + idx) % Math.max(1, ex.items.length - perLesson + 1);
    blocks.push({ lesson: L.n, ex: { ...ex, items: ex.items.slice(start, start + perLesson) } });
  });
  return blocks;
}
function pickVocab(lessonList, count, seed) {
  const pool = lessonList.flatMap((L) => (L.vocab || []).filter((v) => !v.sup && v.en.length < 34 && v.de.split(' ').length <= 3).map((v) => ({ ...v, L: L.n })));
  if (!pool.length) return [];
  const step = pool.length / Math.min(count, pool.length);
  const out = []; for (let i = 0; i < Math.min(count, pool.length); i++) out.push(pool[Math.min(pool.length - 1, Math.floor(i * step + (seed % 2)))]);
  return shuffled([...new Map(out.map((v) => [v.de, v])).values()], seed);
}

/** Review content model (shared by the page renderer and the answer key). */
export function reviewModel(u, lessons) {
  const ls = lessons.filter((l) => l.n >= u.from && l.n <= u.to);
  const per = ls.length > 8 ? 2 : 3;
  const m = { u, vocab: pickVocab(ls, Math.min(16, 12 + ls.length), u.n), unit: exBlocks(ls, per, u.n), look: [], cumulative: [] };
  if (u.n >= 2) m.look.push(...exBlocks(lessons.filter((l) => unitOf(l.n)?.n === u.n - 1).filter((_, i) => i % 2 === 0), 3, u.n + 3, 1).slice(0, 3));
  if (u.n >= 3) m.look.push(...exBlocks(lessons.filter((l) => unitOf(l.n)?.n === u.n - 2).filter((_, i) => i % 3 === 1), 3, u.n + 5, 2).slice(0, 2));
  if (u.n === 4 || u.n === 8) {
    const prior = lessons.filter((l) => l.n < u.from && (u.n === 4 ? true : l.n >= 9)).filter((_, i) => i % (u.n === 4 ? 2 : 4) === 0);
    m.cumulative = exBlocks(prior, 2, u.n + 11, 3);
  }
  return m;
}

function renderBlocks(blocks, prefix, opts) {
  return blocks.map((b, i) => renderExercise(b.ex, i + 1, { label: `Lesson ${b.lesson}`, seed: 500 + b.lesson })).join('');
}

export function renderReview(u, lessons, opts) {
  const m = reviewModel(u, lessons);
  const ls = lessons.filter((l) => l.n >= u.from && l.n <= u.to);
  const o = [`<section class="review" id="R${u.n}" style="page:R${u.n}">${mk(opts, 'R' + u.n)}
  <header class="rv-h"><div class="meta">Unit ${u.n} · Review</div><h2>Revision: ${esc(u.de)}</h2><div class="de-t">${esc(u.en)}</div></header>
  <p class="rv-intro">Try to answer from memory before you check the Answer Key. Questions come from the lessons marked in each heading. Parts A to ${m.look.length ? 'C' : 'B'} bring back older material on purpose: retrieving it again is what keeps it in your memory.</p>`];
  o.push(sec('A · Vocabulary recall', `<p class="rv-intro">Write the German word. Include the article for nouns.</p><table class="recall"><tbody>${m.vocab.map((v, i) => `<tr><td class="e"><b>${i + 1}</b>${esc(v.en)}<span class="sup" style="border:0;color:#9aa">L${v.L}</span></td><td class="b"></td></tr>`).join('')}</tbody></table>`));
  o.push(sec('B · This unit', renderBlocks(m.unit, 'u', opts)));
  if (m.look.length) o.push(sec('C · Look back (earlier units)', renderBlocks(m.look, 'l', opts)));
  if (m.cumulative.length) o.push(sec(u.n === 4 ? 'D · Cumulative review: lessons 1–31' : 'D · Cumulative review: lessons 9–65', renderBlocks(m.cumulative, 'c', opts)));
  const items = ls.flatMap((l) => (l.objectives || []).slice(0, 2).map((x) => ({ x, n: l.n })));
  o.push(sec('Can you do it?', `<p class="rv-intro">Tick what you can do without help. Return to the lesson for anything you cannot tick.</p><ul class="checklist">${items.map((i) => `<li>${md(i.x)} <small>L${i.n}</small></li>`).join('')}</ul>`));
  o.push('</section>');
  return o.join('\n');
}

/* ---------- answer key -------------------------------------------------- */
function answersFor(ex, seed) {
  if (ex.type === 'match') return `<div class="mat">${matchKey(ex, seed)}</div>`;
  return `<ol>${ex.items.map((i) => `<li><span class="a">${md(i.a)}</span>${i.expl ? ` <span class="x">— ${md(i.expl)}</span>` : ''}</li>`).join('')}</ol>`;
}
function exAnswerBlock(ex, no, seed, label) {
  return `<div class="blk"><div class="bt"><span class="eno">${label || 'Ex. ' + no}</span> · ${esc(ex.title)}</div>${answersFor(ex, seed)}</div>`;
}
export function renderAnswerKey(lessons, opts) {
  const o = [];
  const blocks = [];
  for (const u of UNITS) {
    const ls = lessons.filter((l) => l.n >= u.from && l.n <= u.to);
    for (const L of ls) blocks.push(lessonKey(L, u, opts));
    blocks.push(reviewKey(u, lessons, opts));
  }
  blocks.push(lessonKey(lessons[65], null, opts));
  return `<section class="part" style="page:answers" id="ANS">${mk(opts, 'ANS')}<div class="pl">Part</div><h2>Answer Key</h2><div class="flag"></div><p>Answers and short explanations for every comprehension question, exercise and review, in lesson order. Where several answers are possible they are separated by a slash.</p></section>
  <section class="key" style="page:answers">${blocks.join('\n')}</section>`;
}
function lessonKey(L, u, opts) {
  const inner = [];
  if (L.comprehension?.length) inner.push(`<div class="blk"><div class="bt">Check your understanding</div><ol>${L.comprehension.map((c) => `<li><span class="a">${md(c.a)}</span></li>`).join('')}</ol></div>`);
  (L.exercises || []).forEach((ex, i) => inner.push(exAnswerBlock(ex, i + 1, L.n * 10 + i)));
  return `<div class="lessonkey" id="K${L.n}"><div class="ak-h"><span class="n">Lesson ${L.n}</span><span class="t">${esc(L.title)}</span></div><div class="ak">${inner.join('')}</div></div>`;
}
function reviewKey(u, lessons) {
  const m = reviewModel(u, lessons);
  const inner = [];
  inner.push(`<div class="blk"><div class="bt">A · Vocabulary recall</div><ol>${m.vocab.map((v) => `<li><span class="a">${esc(v.de)}${v.pl && v.pl !== '–' ? ' · ' + esc(v.pl) : ''}</span></li>`).join('')}</ol></div>`);
  const add = (title, blocks) => { if (blocks.length) inner.push(...blocks.map((b, i) => exAnswerBlock(b.ex, i + 1, 500 + b.lesson, `${title} · L${b.lesson}`))); };
  add('B', m.unit); add('C', m.look); add('D', m.cumulative);
  return `<div class="lessonkey" id="KR${u.n}"><div class="ak-h"><span class="n">Unit ${u.n}</span><span class="t">Revision: ${esc(u.de)}</span></div><div class="ak">${inner.join('')}</div></div>`;
}

/* ---------- vocabulary index ------------------------------------------- */
const collator = new Intl.Collator('de', { sensitivity: 'base' });
const sortKey = (de) => de.replace(/^(der|die|das)\s+/, '').replace(/^sich\s+/, '').replace(/^\(.*?\)\s*/, '').trim();
export function buildIndex(lessons) {
  const map = new Map();
  for (const L of lessons) for (const v of L.vocab || []) {
    const k = v.de.toLowerCase();
    if (!map.has(k)) map.set(k, { de: v.de, pl: v.pl, en: v.en, lessons: [] });
    const e = map.get(k); if (!e.lessons.includes(L.n)) e.lessons.push(L.n);
    if (!e.pl && v.pl) e.pl = v.pl;
  }
  return [...map.values()].sort((a, b) => collator.compare(sortKey(a.de), sortKey(b.de)));
}
export function renderIndex(lessons, opts) {
  const list = buildIndex(lessons);
  let cur = ''; const out = [];
  for (const e of list) {
    const L0 = sortKey(e.de)[0].toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (L0 !== cur) { cur = L0; out.push(`<div class="il">${esc(L0)}</div>`); }
    const m = /^(der|die|das)\s+(.*)$/.exec(e.de);
    const word = m ? `<b>${esc(m[2])}</b> <span class="art ${m[1]}">${m[1]}</span>${e.pl && e.pl !== '–' ? ` <span style="color:#6A7080">· ${esc(e.pl)}</span>` : ''}` : `<b>${esc(e.de)}</b>`;
    out.push(`<div class="ie"><span>${word} <span class="en">${esc(e.en)}</span></span><span class="ln">${e.lessons.slice(0, 3).map((n) => `<a href="#L${n}">${n}</a>`).join(', ')}</span></div>`);
  }
  return `<section class="fm" style="page:idx" id="IDX">${mk(opts, 'IDX')}<h2>Vocabulary Index</h2><p class="lead">${list.length} words and phrases, alphabetical, with the lessons where they appear.</p><div class="idx">${out.join('')}</div></section>`;
}

/* ---------- contents ---------------------------------------------------- */
function renderToc(lessons, opts) {
  const row = (label, key, cls = '', n = '') => `<a class="toc-row ${cls}" href="#${key}"><span class="n">${n}</span><span class="t">${label}</span><span class="dots"></span><span class="p">${pgOf(opts, key)}</span></a>`;
  const units = UNITS.map((u) => {
    const ls = lessons.filter((l) => l.n >= u.from && l.n <= u.to);
    return `<div class="toc-unit"><div class="uh"><span class="un">Unit ${u.n}</span><span class="ut">${esc(u.de)}</span><span class="ue">${esc(u.en)}</span></div>
      ${ls.map((l) => row(`${esc(l.title)} <small>· ${esc(l.titleDe)}</small>`, 'L' + l.n, '', l.n)).join('')}
      ${row('Unit review', 'R' + u.n, 'rev')}</div>`;
  });
  const back = `<div class="toc-unit"><div class="uh"><span class="un">Part</span><span class="ut">Test, answers and reference</span></div>
    ${row('Final test · Test your German', 'L66', '', 66)}${row('Final self-assessment', 'SELF', 'rev')}${row('Answer key', 'ANS', 'top')}${row('Grammar reference', 'GR', 'top')}${row('Vocabulary index', 'IDX', 'top')}${row('The video playlist', 'VID', 'top')}</div>`;
  const half = Math.ceil(units.length / 2);
  return `<section class="fm" style="page:front" id="TOC">${mk(opts, 'TOC')}<h2>Contents</h2><p class="lead">Eight units, sixty-five lessons and a final test.</p>
    <div style="column-count:2;column-gap:10mm">${units.join('')}${back}</div></section>`;
}

/* ---------- cover ------------------------------------------------------- */
function renderCover() {
  return `<section class="cover"><div class="grid"></div><div class="dots"><i></i><i></i></div>
  <div class="top"><span>Coursebook</span><span>Level A1</span></div>
  <div class="main"><div class="flagbar"><b></b><b></b><b></b></div><h1>Deutsch <span>A1</span></h1><p class="sub">The Beginner's Coursebook</p>
  <p class="desc">A practical learning companion with vocabulary, sentence patterns, grammar, exercises, and revision.</p></div>
  <div class="foot"><span>65 lessons · 8 units</span><span>Common European Framework A1</span></div></section>`;
}

/* ---------- page header definitions ------------------------------------ */
function pageRules(lessons) {
  const q = (s) => JSON.stringify(s);
  const r = [];
  const def = (name, verso, recto) => {
    r.push(`@page ${name}:left{@top-left{content:${q(verso)}}@bottom-left{content:counter(page)}}`);
    r.push(`@page ${name}:right{@top-right{content:${q(recto)}}@bottom-right{content:counter(page)}}`);
  };
  for (const L of lessons) {
    const u = L.unit;
    def('L' + L.n, u ? `Unit ${u.n} · ${u.en}` : 'Final test', `Lesson ${L.n} · ${L.titleDe}`);
  }
  for (const u of UNITS) def('R' + u.n, `Unit ${u.n} · ${u.en}`, `Revision · ${u.de}`);
  def('front', 'Deutsch A1', 'The Beginner’s Coursebook');
  def('answers', 'Deutsch A1', 'Answer Key');
  def('ref', 'Deutsch A1', 'Grammar Reference');
  def('idx', 'Deutsch A1', 'Vocabulary Index');
  def('self', 'Deutsch A1', 'Final Self-assessment');
  return r.join('\n');
}
const marginBoxCss = `
@page :left{@top-left{font:600 7.4pt var(--sans);letter-spacing:.14em;text-transform:uppercase;color:#6A7080;vertical-align:bottom;padding-bottom:6mm;text-align:left}
  @bottom-left{font:600 8.6pt var(--sans);color:#14284B;vertical-align:top;padding-top:6mm;text-align:left;font-variant-numeric:tabular-nums}}
@page :right{@top-right{font:600 7.4pt var(--sans);letter-spacing:.14em;text-transform:uppercase;color:#6A7080;vertical-align:bottom;padding-bottom:6mm;text-align:right}
  @bottom-right{font:600 8.6pt var(--sans);color:#14284B;vertical-align:top;padding-top:6mm;text-align:right;font-variant-numeric:tabular-nums}}
`;

/* ---------- assemble ---------------------------------------------------- */
export function buildHtml(opts = {}) {
  const lessons = loadLessons();
  const body = [];
  body.push(renderCover());
  body.push(titlePage());
  body.push(welcome());
  body.push(renderToc(lessons, opts));
  for (const u of UNITS) {
    body.push(renderOpener(u, lessons, opts));
    lessons.filter((l) => l.n >= u.from && l.n <= u.to).forEach((l) => body.push(renderLesson(l, opts)));
    body.push(renderReview(u, lessons, opts));
  }
  body.push(`<section class="part" style="page:front" id="FIN">${mk(opts, 'FIN')}<div class="pl">Part</div><h2>Test Your German</h2><div class="flag"></div><p>Lesson 66 of the video course is a test. Take it after Unit 8, then use the self-assessment to decide what to revisit.</p></section>`);
  body.push(renderLesson(lessons[65], opts));
  body.push(`<section class="fm" style="page:self" id="SELF">${mk(opts, 'SELF')}<h2>Final Self-assessment</h2><p class="lead">Be honest. Tick only what you can do without looking.</p>
    <div class="scale"><div class="s">Test score</div><div>Count your correct answers in lesson 66 (30 items).</div>
    <div class="s">26–30</div><div>Excellent. You are ready to begin A2.</div><div class="s">20–25</div><div>Good. Revise the units where you missed items, then begin A2.</div>
    <div class="s">12–19</div><div>Solid base. Redo the reviews of the weakest units and repeat the test in two weeks.</div>
    <div class="s">0–11</div><div>Return to Unit 1 and repeat the study routine from the front of the book. Re-watch each video once.</div></div>
    ${selfAssessment(lessons)}</section>`);
  body.push(renderAnswerKey(lessons, opts));
  body.push(`<section class="fm" style="page:ref" id="GR">${mk(opts, 'GR')}<h2>Grammar Reference</h2><p class="lead">The whole of A1 grammar on a few pages. Supplementary: compiled by the editors.</p>${GRAMMAR_REF()}</section>`);
  body.push(renderIndex(lessons, opts));
  body.push(`<section class="fm" style="page:idx" id="VID">${mk(opts, 'VID')}<h2>The Video Playlist</h2><p class="lead">All 66 videos, in course order.</p><table class="vl"><tbody>${lessons.map((l) => `<tr><td class="n">${l.n}</td><td>${esc(l.title)}</td><td class="u"><a href="${l.url}">${l.url.replace('https://', '')}</a></td></tr>`).join('')}</tbody></table></section>`);
  body.push(`<section class="backcover"><div class="dots"><i></i><i></i></div><div class="mark">Deutsch A1<br>The Beginner's Coursebook</div></section>`);
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Deutsch A1 — The Beginner's Coursebook</title>
  <meta name="author" content="Deutsch A1 coursebook"><style>${css}\n${marginBoxCss}\n${pageRules(lessons)}</style></head><body>${body.join('\n')}</body></html>`;
  return html;
}
