# Lesson content spec (source of truth: `content/lessons/NN.json`)

Each lesson of the playlist becomes ONE JSON file `content/lessons/NN.json` (NN = zero-padded original lesson number).
Input: `source/transcripts/NN.txt` (YouTube auto-captions: English words are fine, but **German words are often garbled** —
reconstruct the correct standard German from context and your own knowledge; never copy a garbled spelling).
Metadata: `source/playlist.json` (list of `[videoId, title]`, index = lesson number − 1).

## Rules
- Read the whole transcript. Base the lesson on what the teacher actually teaches (vocabulary, patterns, rules, examples).
  Anything you ADD that is not in the video (extra examples, extra exercises, extra tables for completeness) must be
  marked `"sup": true` on that object. Source-based items omit `sup`.
- Never invent video content. If the transcript is truncated/garbled, say so in `"sourceNote"`.
- Level A1 only. No unexplained grammar (no Genitiv, Konjunktiv II beyond *möchte*, Passiv, Relativsätze …).
- Primary explanations in English. Arabic (`ar`) only where it genuinely helps (key vocab words, 1 line on a hard rule). Modern Standard Arabic, short.
- German must be perfect: spelling, ß/ä/ö/ü, capitalised nouns, correct article + plural, verb conjugation, V2 word order, punctuation.
- Nouns: `de` includes article, e.g. `"der Tisch"`, and `pl` gives plural, e.g. `"die Tische"` (or `"–"` if none/uncountable).
- Every exercise item must have ONE unambiguous correct answer `a` (if several are valid, list them separated by ` / `) and a short `expl` for non-trivial ones. Re-check each answer before finishing.
- Exercises only use words/grammar taught in this lesson or earlier lessons (lesson numbers < current). No emoji anywhere.
- Quantity guide: 12–30 vocab items (only if the lesson has vocab), 2–5 exercise sets of 5–8 items, 1–2 dialogues of 4–8 lines, 3–5 comprehension questions, 3–6 summary bullets. Adapt to the lesson — omit sections (use `[]`/omit) that are not relevant.
- Text fields allow only `**bold**` and `*italic*` inline markup (no HTML, no markdown headings/lists/tables). Use `\n\n` for paragraph breaks.
- JSON must be valid UTF-8, 2-space indent, no trailing commas, no comments.

## Schema
```jsonc
{
  "n": 1,                                  // lesson number
  "title": "Greetings",                    // short English title (≤ 6 words)
  "titleDe": "Begrüßungen",                // short German title
  "level": "A1",
  "sourceNote": "",                        // optional: caveats about transcript quality
  "objectives": ["I can greet people at different times of day", "..."],   // 3-5 "I can ..." statements
  "vocab": [ { "de": "der Tisch", "pl": "die Tische", "en": "table", "ar": "طاولة", "note": "", "sup": false } ],
  // For non-nouns omit "pl". For verbs give infinitive in "de". "note" optional (≤ 8 words).
  "expressions": [ { "de": "Guten Morgen!", "en": "Good morning!", "ar": "", "sup": false } ],
  "patterns": [ { "form": "Ich heiße + [Name].", "ex": "Ich heiße Anna.", "en": "My name is Anna." } ],
  "grammar": [
    { "title": "Short heading",
      "body": "Explanation paragraphs, **bold** for key forms.",
      "ar": "optional one-line Arabic clarification",
      "table": { "head": ["", "Singular", "Plural"], "rows": [["der", "...", "..."]] },   // optional
      "examples": [ { "de": "Ich habe einen Hund.", "en": "I have a dog." } ],           // optional
      "sup": false } ],
  "mistakes": [ { "wrong": "Ich bin 20 Jahre.", "right": "Ich bin 20 Jahre alt.", "why": "Age needs *alt*." } ],   // 0-3 common mistakes
  "pronunciation": [ { "de": "ü", "tip": "Round lips as for 'oo', say 'ee'. *Tür*, *über*." } ],                  // 0-4
  "dialogues": [ { "title": "At the café", "lines": [ { "who": "A", "de": "Hallo!", "en": "Hello!" } ] } ],
  "tip": "One quick study tip or cultural note (optional).",
  "comprehension": [ { "q": "How do you say 'good evening'?", "a": "Guten Abend." } ],   // about the lesson content, answerable from the lesson page
  "exercises": [
    { "title": "Fill in the gap",
      "type": "fill",                       // fill | translate | choose | reorder | match | answer
      "instructions": "Complete with the correct article.",
      "items": [ { "q": "___ Tisch ist groß.", "a": "Der", "expl": "*Tisch* is masculine." } ],
      "sup": false } ],
  "summary": ["Bullet 1", "Bullet 2"]
}
```
`choose` items: put the options in the question, e.g. `"Das ist ___ Frau. (ein / eine)"`.
`reorder` items: question is the scrambled words separated by ` / `, answer is the full correct sentence.
`match` items: `q` = German, `a` = English (or vice versa) — 5-8 pairs; the renderer shuffles the right column.

## Units (for context only — the renderer handles them)
1 Hallo! (1–8) · 2 Satzbau & Verben (9–16) · 3 Wörter & Artikel (17–25) · 4 Akkusativ & Bestellen (26–31) ·
5 Dativ & Zeit (32–39) · 6 Unterwegs & Vergangenheit (40–47) · 7 Alltag (48–59) · 8 Behörden & Wohnen (60–65)
Lesson 66 is a video test: make it a lesson with `"title": "Test Your German"` containing only: objectives, a 30-item mixed-skills quiz in `exercises` (type `choose`/`fill`, using only A1 content from lessons 1–65), `summary`.
Do NOT run any generation/build scripts; only write your JSON files and validate them with `node -e "JSON.parse(require('fs').readFileSync(F))"`.
