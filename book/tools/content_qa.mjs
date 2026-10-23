// Deeper automatic content checks on exercise logic.
import fs from 'fs';
const norm = (s) => s.toLowerCase().replace(/[.,!?;:"“”„]/g, '').trim();
let bad = 0; const out = [];
for (let n = 1; n <= 66; n++) {
  const L = JSON.parse(fs.readFileSync(`content/lessons/${String(n).padStart(2, '0')}.json`, 'utf8'));
  (L.exercises || []).forEach((ex, ei) => ex.items.forEach((it, ii) => {
    const tag = `L${n} ex${ei + 1}.${ii + 1}`;
    if (ex.type === 'reorder') {
      const toks = (x) => x.split(/[\s\/]+/).map(norm).filter(Boolean).sort().join('|');
      const qw = toks(it.q.replace(/\s\/\s\?$/, ''));
      const alts = it.a.split(/\s\/\s/); // alternative sentences separated by " / "
      const ok = alts.every((alt) => toks(alt) === qw);
      if (!ok) { bad++; out.push(`${tag} REORDER mismatch: "${it.q}" -> "${it.a}"`); }
    }
    if (ex.type === 'choose') {
      const m = /\(([^()]*\/[^()]*)\)\s*$/.exec(it.q);
      if (m) {
        const opts = m[1].split('/').map(norm);
        const alts = it.a.split('/').map(norm);
        if (!alts.every((x) => opts.includes(x)) && !opts.includes(norm(it.a))) { bad++; out.push(`${tag} CHOOSE answer not in options: "${it.q}" -> "${it.a}"`); }
      }
    }
    if (ex.type === 'fill' && /_{2,}/.test(it.q) && !it.a) { bad++; out.push(`${tag} empty fill answer`); }
    if (/^(der|die|das) [a-zäöüß]/.test(it.a || '')) { out.push(`${tag} (warn) lower-case noun after article in answer: ${it.a}`); }
  }));
  for (const v of L.vocab || []) {
    if (/^(der|die|das) [a-zäöüß]/.test(v.de) && !/[A-ZÄÖÜ]/.test(v.de)) { bad++; out.push(`L${n} vocab noun not capitalised: ${v.de}`); }
    if (v.pl && v.pl !== '–' && !/^die /.test(v.pl)) out.push(`L${n} (warn) plural without 'die': ${v.pl}`);
  }
}
console.log(out.join('\n')); console.log('HARD ISSUES:', bad);
