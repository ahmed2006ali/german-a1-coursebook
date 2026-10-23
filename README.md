# Deutsch A1 — The Beginner's Coursebook

A professionally typeset coursebook for the free YouTube playlist [A1 (Free Course) | Learn German for beginners](https://youtube.com/playlist?list=PLF9mJC4RrjIhS4MMm0x72-qWEn1LRvPuW) (66 videos, 65 lessons + final test).

## Deliverables

| File | Location |
|------|----------|
| PDF | `book/output/German_A1_Complete_Coursebook.pdf` |
| Editable DOCX | `book/output/German_A1_Complete_Coursebook_Editable.docx` |
| Lesson manifest | `book/output/lesson_manifest.json` |
| QA report | `book/output/QA_Report.md` |

## Rebuild

Requires Node.js 20+ and Playwright Chromium (see `book/src/render.mjs` for the browser path).

```bash
cd book
npm install
./build.sh
```

## Source of truth

- Lesson content: `book/content/lessons/NN.json`
- Video metadata & transcripts: `book/source/`
- Layout & generation: `book/src/book.css`, `book/src/book.mjs`, `book/src/render.mjs`, `book/src/docx.mjs`

This is an independent study companion; it is not affiliated with the video channel.
