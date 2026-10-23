// Verifies every character used in the book exists in the bundled font that is meant to render it.
import fs from 'fs'; import * as fontkit from 'fontkit';
const html = fs.readFileSync('build/book.html','utf8').replace(/<style>[\s\S]*?<\/style>/,'').replace(/<[^>]+>/g,' ');
const chars=[...new Set(html)].filter(c=>c.codePointAt(0)>126||false);
const load=f=>fontkit.openSync('assets/fonts/'+f);
const fonts={serif:load('source-serif-4-latin-400-normal.woff2'),sans:load('source-sans-3-latin-400-normal.woff2'),ar:load('noto-naskh-arabic-arabic-400-normal.woff2')};
const miss={};
for(const c of chars){ const cp=c.codePointAt(0); const isAr=cp>=0x600&&cp<=0x6ff||cp>=0xfb50&&cp<=0xfeff;
  const f=isAr?fonts.ar:fonts.sans; if(!f.hasGlyphForCodePoint(cp)) (miss[isAr?'arabic':'sans']??=[]).push(c+' U+'+cp.toString(16)); }
console.log(JSON.stringify(miss,null,1));
for(const c of 'äöüÄÖÜß') for(const k of ['serif','sans']) if(!fonts[k].hasGlyphForCodePoint(c.codePointAt(0))) console.log('MISSING',c,k);
console.log('german chars OK check done; distinct non-ASCII chars:',chars.length);
