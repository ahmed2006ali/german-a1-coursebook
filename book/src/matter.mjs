// Front matter and reference sections (editorial content written for this book).
import { esc, md, mdParas, UNITS } from './model.mjs';

const t = (head, rows, cls = '') =>
  `<table class="gt ${cls}"><thead><tr>${head.map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows
    .map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`;

export function titlePage() {
  return `<section class="fm first" style="page:plain"><div class="titlepage">
  <div class="tp-main"><h1>Deutsch A1</h1><p class="tp-sub">The Beginner's Coursebook</p><div class="tp-rule"></div>
  <p class="imprint" style="font-size:10pt;color:#1B2233;max-width:100mm">A practical learning companion with vocabulary, sentence patterns, grammar, exercises, and revision.</p></div>
  <div class="imprint">
    <p><strong>About this book.</strong> This coursebook follows the free video series <em>A1 (Free Course) – Learn German for beginners</em> published on YouTube by the channel <em>Learn German</em>: 65 lessons plus a final test. Lesson numbers and titles match the original videos, and every lesson links back to its video.</p>
    <p>Material taken from the videos is unmarked. Material added by the editors to give you more practice or a clearer explanation is marked <span class="sup" style="margin-left:0">+</span> or <em>Supplementary</em>. The Grammar Reference at the back is supplementary throughout.</p>
    <p>This is an independent study companion. It is not produced, endorsed or affiliated with the video channel. Please watch the original videos; they are the source of the teaching.</p>
    <p>Edition 2026 · Typeset in Source Serif 4 and Source Sans 3 (SIL Open Font License) with Noto Naskh Arabic.</p>
  </div></div></section>`;
}

export function welcome() {
  return `<section class="fm" style="page:front"><h2>Welcome</h2><p class="lead">Willkommen. Here is how this book works.</p>
  <p>This book turns the A1 video course into something you can study with a pencil. Each lesson page gives you the vocabulary, patterns and grammar of the video in a form you can scan, cover and test. The exercises are for writing in, and the answers are in the back so that you are never stuck.</p>
  <p>The explanations are in English. Short Arabic notes are added only where they help a beginner.</p>
  <h3>How the book is organised</h3>
  <p>The course has <strong>eight units</strong>. Each unit opens with a picture and a list of what you will be able to do. It ends with a <strong>Review</strong> that brings back words and exercises from earlier lessons on purpose, because that is how memory works. At the back you will find the final test, the answer key, a grammar reference and an alphabetical vocabulary index.</p>
  <h3>Reading the page</h3>
  <div class="conv">
    <div class="k"><span class="swatch">Vocabulary</span></div><div>German on the left, with its article and plural for nouns, then English, then Arabic. Cover the right-hand columns and test yourself.</div>
    <div class="k"><span class="swatch">Articles</span></div><div>Nouns carry their article in colour: <span class="art der">der</span> masculine, <span class="art die">die</span> feminine, <span class="art das">das</span> neuter. Always learn the noun together with its article.</div>
    <div class="k"><span class="swatch">Patterns</span></div><div>A red rule marks a sentence pattern you can reuse by swapping words.</div>
    <div class="k"><span class="swatch">Grammar</span></div><div>Short explanations with a table and examples. Navy headings in the tables are the forms to memorise.</div>
    <div class="k"><span class="swatch">Mistakes</span></div><div>Wrong forms are struck through in red, the correct form follows in navy.</div>
    <div class="k"><span class="swatch">Dialogues</span></div><div>Read them aloud, then cover the English and translate back.</div>
    <div class="k"><span class="swatch">Tip</span></div><div>A pale-blue box with one study tip or cultural note.</div>
    <div class="k"><span class="swatch">Exercises</span></div><div>Write directly in the book. Gaps <span style="display:inline-block;width:12mm;border-bottom:.6pt solid #14284B"></span> are for words; dotted lines are for sentences.</div>
    <div class="k"><span class="swatch">Marks</span></div><div>Unmarked content comes from the video. <span class="sup" style="margin-left:0">+</span> and the label <em>Supplementary</em> mark extra material added by the editors.</div>
  </div>
  </section>
  <section class="fm" style="page:front"><h2>How to study</h2><p class="lead">A routine that takes about an hour per lesson.</p>
  <ol class="steps">
    <li><b>Watch the video once, without writing.</b> Follow the sound of the language first. Use the link on the lesson page.</li>
    <li><b>Read the lesson page.</b> Read the objectives, then the vocabulary. Say every word aloud, including the article.</li>
    <li><b>Cover and recall.</b> Cover the English column and say each German word. Mark the ones you missed with a pencil dot.</li>
    <li><b>Do the exercises without looking back.</b> Write your answers, then check them in the Answer Key. Read the explanation for every mistake.</li>
    <li><b>Read the dialogues aloud twice.</b> Then say your own version, with your name, your city and your family.</li>
    <li><b>Answer the comprehension questions from memory.</b> If you cannot, re-read the grammar box once and try again tomorrow.</li>
    <li><b>Finish with the unit review.</b> Do it a few days after the last lesson of the unit, not the same day.</li>
  </ol>
  <h3>A simple repetition schedule</h3>
  <p>Memory fades quickly and then slowly, so review at growing intervals. After each lesson, return to its vocabulary page on these days:</p>
  <table class="schedule"><thead><tr><th style="width:28mm">When</th><th>What to do</th><th style="width:22mm">Time</th></tr></thead><tbody>
    <tr><td><b>Day 1</b></td><td>Study the lesson. Do the exercises.</td><td>45–60 min</td></tr>
    <tr><td><b>Day 2</b></td><td>Cover the English column and recall every word. Redo the exercises you got wrong.</td><td>10 min</td></tr>
    <tr><td><b>Day 4</b></td><td>Recall the vocabulary again. Read the dialogue aloud.</td><td>10 min</td></tr>
    <tr><td><b>Day 8</b></td><td>Write five sentences using the patterns of the lesson.</td><td>10 min</td></tr>
    <tr><td><b>Day 15</b></td><td>Do the “Look back” section of the unit review.</td><td>15 min</td></tr>
    <tr><td><b>Day 30</b></td><td>Take the final test for the units you have finished.</td><td>20 min</td></tr>
  </tbody></table>
  <h3>Pronunciation in one minute</h3>
  <p>German spelling is more consistent than English, but patterns must be learned. As a rule, every letter is sounded. Key points: <em>ä</em> sounds like the <em>e</em> in “bed”; <em>ö</em> and <em>ü</em> have no English equivalent (see lesson 5); <em>ß</em> is a sharp <em>ss</em>; <em>ei</em> sounds like “eye”; <em>ie</em> sounds like “ee”; <em>v</em> is usually like “f” in native German words (<em>vier</em>), but like “v” in foreign words (<em>Visum</em>); and <em>w</em> sounds like English “v”. Nouns are always written with a capital letter. Exceptions and regional variations exist—the lessons cover the most important ones.</p>
  </section>`;
}

export const GRAMMAR_REF = () => {
  const sec = (n, title, inner) => `<section><h3><span class="gn">${n}</span>${esc(title)}</h3>${inner}</section>`;
  const parts = [];
  parts.push(sec('1', 'Personal pronouns', `<p class="note">The pronoun changes with its job in the sentence. <em>Sie</em> (capital S) is the polite “you”. It uses the same verb form as <em>sie</em> (they).</p>` +
    t(['', 'Nominative (subject)', 'Accusative', 'Dative'], [
      ['1st singular', 'ich', 'mich', 'mir'], ['2nd singular', 'du', 'dich', 'dir'],
      ['3rd masculine', 'er', 'ihn', 'ihm'], ['3rd feminine', 'sie', 'sie', 'ihr'], ['3rd neuter', 'es', 'es', 'ihm'],
      ['1st plural', 'wir', 'uns', 'uns'], ['2nd plural', 'ihr', 'euch', 'euch'],
      ['3rd plural', 'sie', 'sie', 'ihnen'], ['polite', 'Sie', 'Sie', 'Ihnen'],
    ])));
  parts.push(sec('2', 'Verbs in the present tense', `<p class="note">For most verbs: take the infinitive, remove <em>-en</em> and add the ending. If the stem ends in <em>-t</em> or <em>-d</em> (<em>arbeiten</em>, <em>finden</em>) add an extra <em>e</em> before <em>-st</em> and <em>-t</em>: <em>du arbeitest</em>, <em>er arbeitet</em>.</p>` +
    `<div class="two"><div>${t(['', 'machen', 'arbeiten'], [
      ['ich', 'mache', 'arbeite'], ['du', 'machst', 'arbeitest'], ['er / sie / es', 'macht', 'arbeitet'],
      ['wir', 'machen', 'arbeiten'], ['ihr', 'macht', 'arbeitet'], ['sie / Sie', 'machen', 'arbeiten'],
    ])}</div><div>${t(['', 'haben', 'sein'], [
      ['ich', 'habe', 'bin'], ['du', 'hast', 'bist'], ['er / sie / es', 'hat', 'ist'],
      ['wir', 'haben', 'sind'], ['ihr', 'habt', 'seid'], ['sie / Sie', 'haben', 'sind'],
    ])}</div></div>` +
    `<p class="note"><strong>Vowel-change verbs.</strong> Some verbs change their stem vowel in <em>du</em> and <em>er / sie / es</em> only. Learn them as a pair.</p>` +
    t(['Infinitive', 'ich', 'du', 'er / sie / es'], [
      ['sprechen', 'spreche', 'sprichst', 'spricht'], ['essen', 'esse', 'isst', 'isst'],
      ['lesen', 'lese', 'liest', 'liest'], ['sehen', 'sehe', 'siehst', 'sieht'],
      ['fahren', 'fahre', 'fährst', 'fährt'], ['nehmen', 'nehme', 'nimmst', 'nimmt'],
    ]) +
    `<p class="note"><strong>möchten</strong> (would like): <em>ich möchte, du möchtest, er / sie / es möchte, wir möchten, ihr möchtet, sie / Sie möchten.</em> The second verb goes to the end of the sentence in the infinitive: <em>Ich möchte einen Kaffee trinken.</em></p>`));
  parts.push(sec('3', 'Articles and their endings', `<p class="note">The article shows the <strong>gender</strong> and the <strong>case</strong>. Indefinite (<em>ein</em>), negative (<em>kein</em>) and possessive articles (<em>mein, dein, sein, ihr, unser, euer, ihr, Ihr</em>) share the same endings.</p>` +
    t(['Definite', 'masculine', 'feminine', 'neuter', 'plural'], [
      ['Nominative', 'der', 'die', 'das', 'die'], ['Accusative', 'den', 'die', 'das', 'die'], ['Dative', 'dem', 'der', 'dem', 'den (+ n)'],
    ]) +
    t(['Indefinite / negative / possessive', 'masculine', 'feminine', 'neuter', 'plural'], [
      ['Nominative', 'ein / kein / mein', 'eine / keine / meine', 'ein / kein / mein', '– / keine / meine'],
      ['Accusative', 'einen / keinen / meinen', 'eine / keine / meine', 'ein / kein / mein', '– / keine / meine'],
      ['Dative', 'einem / keinem / meinem', 'einer / keiner / meiner', 'einem / keinem / meinem', '– / keinen / meinen (+ n)'],
    ]) +
    `<p class="note">Only the <strong>masculine accusative</strong> changes compared with the nominative: <em>der → den</em>, <em>ein → einen</em>. Feminine, neuter and plural stay the same.</p>`));
  parts.push(sec('4', 'Word order', `
    <div class="formula"><b>Statement</b> — the conjugated verb is always in position 2.<br><span class="de">Ich lerne heute Deutsch.</span> · <span class="de">Heute lerne ich Deutsch.</span></div>
    <div class="formula"><b>W-question</b> — question word first, verb second.<br><span class="de">Wo wohnst du?</span> · <span class="de">Was möchten Sie trinken?</span></div>
    <div class="formula"><b>Yes / no question</b> — verb first.<br><span class="de">Hast du Geschwister?</span> · <span class="de">Sind Sie Lehrer?</span></div>
    <div class="formula"><b>Separable verbs</b> — the prefix goes to the end.<br><span class="de">Ich stehe um sieben Uhr auf.</span> (aufstehen)</div>
    <div class="formula"><b>Perfekt</b> — <em>haben / sein</em> in position 2, the participle at the end.<br><span class="de">Ich habe Pizza gegessen.</span> · <span class="de">Wir sind nach Berlin gefahren.</span></div>
    <div class="formula"><b>Imperative</b> — verb first, no pronoun for <em>du</em>.<br><span class="de">Komm bitte her!</span> · <span class="de">Kommen Sie bitte herein!</span></div>
    <div class="v2"><div class="row"><div class="lab">Position</div><div class="lab">1</div><div class="lab">2 (verb)</div><div class="lab">3 …</div><div class="lab">end</div></div>
      <div class="row"><div class="lab">Statement</div><div class="c">Ich</div><div class="c verb">lerne</div><div class="c">heute</div><div class="c">Deutsch.</div></div>
      <div class="row"><div class="lab">With time first</div><div class="c">Heute</div><div class="c verb">lerne</div><div class="c">ich</div><div class="c">Deutsch.</div></div>
      <div class="row"><div class="lab">W-question</div><div class="c q">Was</div><div class="c verb">lernst</div><div class="c">du</div><div class="c">heute?</div></div>
      <div class="row"><div class="lab">Yes / no question</div><div class="c empty"></div><div class="c verb">Lernst</div><div class="c">du</div><div class="c">Deutsch?</div></div>
      <div class="row"><div class="lab">Separable verb</div><div class="c">Ich</div><div class="c verb">stehe</div><div class="c">um sieben Uhr</div><div class="c">auf.</div></div>
      <div class="row"><div class="lab">Perfekt</div><div class="c">Ich</div><div class="c verb">habe</div><div class="c">Pizza</div><div class="c">gegessen.</div></div>
    </div>`));
  parts.push(sec('5', 'Negation: nicht and kein', `
    <div class="formula"><b>kein</b> negates a noun with <em>ein</em> or with no article.<br><span class="de">Ich habe einen Bruder.</span> → <span class="de">Ich habe keinen Bruder.</span></div>
    <div class="formula"><b>nicht</b> negates everything else (verbs, adjectives, adverbs, nouns with <em>der / mein</em>). When negating a verb it goes near the end; when negating an adjective or noun it goes immediately before it.<br><span class="de">Ich komme nicht.</span> · <span class="de">Das ist nicht gut.</span> · <span class="de">Das ist nicht mein Auto.</span></div>`));
  parts.push(sec('6', 'Numbers', t(['', '0–9', '10–19'], [
      ['', 'null, eins, zwei, drei, vier, fünf, sechs, sieben, acht, neun', 'zehn, elf, zwölf, dreizehn, vierzehn, fünfzehn, sechzehn, siebzehn, achtzehn, neunzehn'],
    ]) + t(['Tens', 'Pattern', 'Hundreds and above'], [
      ['20 zwanzig · 30 dreißig · 40 vierzig', '21 = <em>einundzwanzig</em> (one-and-twenty). Say the unit first.', '100 hundert · 200 zweihundert · 1 000 tausend'],
      ['50 fünfzig · 60 sechzig · 70 siebzig', '36 = <em>sechsunddreißig</em>', '345 = <em>dreihundertfünfundvierzig</em>'],
      ['80 achtzig · 90 neunzig', '99 = <em>neunundneunzig</em>', '2 500 = <em>zweitausendfünfhundert</em>'],
    ])));
  parts.push(sec('7', 'Telling the time', `<p class="note">Two systems. The <strong>official</strong> one (timetables, news) just reads the numbers. The <strong>unofficial</strong> one (everyday speech) uses <em>nach, vor, Viertel, halb</em>.</p>` +
    t(['Time', 'Official', 'Unofficial'], [
      ['08:00', 'acht Uhr', 'acht Uhr'], ['08:15', 'acht Uhr fünfzehn', 'Viertel nach acht'],
      ['08:30', 'acht Uhr dreißig', 'halb neun'], ['08:45', 'acht Uhr fünfundvierzig', 'Viertel vor neun'],
      ['08:10', 'acht Uhr zehn', 'zehn nach acht'], ['08:50', 'acht Uhr fünfzig', 'zehn vor neun'],
    ]) + `<p class="note"><em>halb neun</em> means “half to nine”, that is 8:30, not 9:30.</p>`));
  parts.push(sec('8', 'The Perfekt (spoken past)', `<p class="note">Conjugate <em>haben</em> (or <em>sein</em>) in position 2 and put the <strong>past participle</strong> at the end. Most verbs use <em>haben</em>. Verbs of motion or change of location (<em>gehen, fahren, kommen, fliegen</em>) and a few others (<em>bleiben</em> – to stay, <em>sein</em> – to be) use <em>sein</em>. Learn each verb’s auxiliary as you meet it.</p>` +
    t(['Type', 'Participle pattern', 'Examples'], [
      ['Regular', 'ge- + stem + <em>-t</em>', 'machen → gemacht · lernen → gelernt · spielen → gespielt'],
      ['Irregular', 'ge- + stem (often changed) + <em>-en</em>', 'essen → gegessen · trinken → getrunken · sehen → gesehen'],
      ['With sein', 'ge- … -en, with sein', 'gehen → gegangen · fahren → gefahren · kommen → gekommen'],
      ['Separable', '<em>ge</em> goes between prefix and stem', 'aufstehen → aufgestanden · einkaufen → eingekauft'],
      ['Inseparable', 'no <em>ge-</em>', 'besuchen → besucht · verstehen → verstanden'],
      ['-ieren verbs', 'no <em>ge-</em>', 'studieren → studiert · telefonieren → telefoniert'],
    ])));
  parts.push(sec('9', 'The imperative', t(['', 'regular verb', 'example'], [
      ['du', 'stem (no <em>-st</em>)', 'Mach! · Komm! · Lies! · Sprich!'],
      ['ihr', 'same as the <em>ihr</em> form', 'Macht! · Kommt!'],
      ['Sie', 'verb + <em>Sie</em>', 'Machen Sie! · Kommen Sie!'],
    ]) + `<p class="note">Add <em>bitte</em> to be polite: <em>Komm bitte!</em> · <em>Setzen Sie sich bitte.</em> The verb <em>sein</em> is irregular: <em>Sei ruhig! · Seid ruhig! · Seien Sie ruhig!</em></p>`));
  parts.push(sec('10', 'Question words', t(['Word', 'Meaning', 'Example'], [
      ['wer', 'who', 'Wer ist das?'], ['was', 'what', 'Was machst du?'], ['wo', 'where', 'Wo wohnen Sie?'],
      ['woher', 'where from', 'Woher kommst du?'], ['wohin', 'where to', 'Wohin gehst du?'],
      ['wann', 'when', 'Wann hast du Zeit?'], ['wie', 'how', 'Wie geht es dir?'],
      ['wie viel / wie viele', 'how much / how many', 'Wie viele Kinder haben Sie?'], ['warum', 'why', 'Warum lernst du Deutsch?'],
      ['welch-', 'which', 'Welches Buch möchten Sie?'],
    ])));
  return `<div class="gr">${parts.join('')}</div>`;
};

export function selfAssessment(lessons) {
  const byUnit = UNITS.map((u) => {
    const items = lessons.filter((l) => l.n >= u.from && l.n <= u.to).flatMap((l) => (l.objectives || []).slice(0, 2).map((o) => ({ o, n: l.n })));
    return `<h3>Unit ${u.n} · ${esc(u.de)}</h3><ul class="checklist">${items.map((i) => `<li>${md(i.o)} <small>L${i.n}</small></li>`).join('')}</ul>`;
  }).join('');
  return byUnit;
}
