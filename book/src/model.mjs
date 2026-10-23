// Shared model: units, content loading and small helpers.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const UNITS = [
  { n: 1, de: 'Hallo!', en: 'First Contact', from: 1, to: 8, img: 'u1_greeting.jpg',
    blurb: 'Greet people, use the most common phrases, count to one hundred, spell your name and introduce yourself. These eight lessons give you the survival language for a first conversation.' },
  { n: 2, de: 'Satzbau und Verben', en: 'Sentences and Verbs', from: 9, to: 16, img: 'u2_classroom.jpg',
    blurb: 'Learn how a German sentence is built, meet the personal pronouns, and conjugate haben, sein, regular and irregular verbs. The unit closes with numbers above one hundred.' },
  { n: 3, de: 'Wörter und Artikel', en: 'Words and Articles', from: 17, to: 25, img: 'u3_family.jpg',
    blurb: 'Describe things with adjectives and opposites, introduce other people, and master the articles der, die, das, ein, eine and kein. You also learn to tell the time and talk about your family.' },
  { n: 4, de: 'Akkusativ und Bestellen', en: 'Accusative and Ordering', from: 26, to: 31, img: 'u4_cafe.jpg',
    blurb: 'Your first case: the accusative. Use it with possessives and pronouns, say what you would like with möchten, ask questions with W-words and order in a restaurant or café.' },
  { n: 5, de: 'Dativ und Zeit', en: 'Dative and Time', from: 32, to: 39, img: 'u5_time.jpg',
    blurb: 'Meet the dative case, ordinal numbers and questions about time. Then describe your day with separable verbs and give instructions with the imperative.' },
  { n: 6, de: 'Unterwegs und Vergangenheit', en: 'On the Move and the Past', from: 40, to: 47, img: 'u6_travel.jpg',
    blurb: 'Ask for and give directions, talk about the past with war, hatte and the Perfekt, describe how you feel when you are unwell, and tell someone what you did on holiday.' },
  { n: 7, de: 'Alltag', en: 'Everyday Life', from: 48, to: 59, img: 'u7_everyday.jpg',
    blurb: 'Everyday situations: the supermarket, the weather, appointments, invitations, likes and dislikes, shopping for clothes, taxis, the telephone and the doctor.' },
  { n: 8, de: 'Formulare, Post und Wohnen', en: 'Forms, Post and Housing', from: 60, to: 65, img: 'u8_services.jpg',
    blurb: 'Practical German for official life: write a formal letter, fill in a form, use the post office and the bank, look for an apartment and buy a train ticket.' },
];

export const unitOf = (n) => UNITS.find((u) => n >= u.from && n <= u.to) || null;

export function loadLessons() {
  const playlist = JSON.parse(fs.readFileSync(path.join(ROOT, 'source/playlist.json'), 'utf8'));
  const lessons = [];
  for (let n = 1; n <= 66; n++) {
    const f = path.join(ROOT, 'content/lessons', String(n).padStart(2, '0') + '.json');
    const L = JSON.parse(fs.readFileSync(f, 'utf8'));
    const [id, ytTitle] = playlist[n - 1];
    L.videoId = id; L.videoTitle = ytTitle; L.url = `https://youtu.be/${id}`;
    L.unit = unitOf(n);
    lessons.push(L);
  }
  return lessons;
}

export const esc = (s) => String(s ?? '').replace(/[\u200e\u200f\u202a-\u202e]/g, '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Inline markup: **bold**, *italic*. */
export function md(s) {
  let t = esc(s);
  t = t.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  t = t.replace(/\*(.+?)\*/g, '<em>$1</em>');
  return t;
}
export function mdParas(s) {
  return String(s ?? '').split(/\n\s*\n/).map((p) => `<p>${md(p.trim())}</p>`).join('');
}
export const strip = (s) => String(s ?? '').replace(/\*+/g, '');

/** Wrap a leading article in a gender-coloured span. */
export function artHtml(de) {
  const m = /^(der|die|das)\s+(.*)$/.exec(de);
  if (!m) return esc(de);
  return `<span class="art ${m[1]}">${m[1]}</span> ${esc(m[2])}`;
}

// Deterministic PRNG so every build is identical.
export function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
}
export function shuffled(arr, seed) {
  const r = rng(seed); const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
/** Shuffle indices so that no element stays in place (when n>1). */
export function derange(n, seed) {
  if (n < 2) return [0];
  for (let k = 0; k < 50; k++) {
    const p = shuffled([...Array(n).keys()], seed + k * 7919);
    if (p.every((v, i) => v !== i)) return p;
  }
  return [...Array(n).keys()].map((i) => (i + 1) % n);
}
export const letter = (i) => String.fromCharCode(97 + i);
