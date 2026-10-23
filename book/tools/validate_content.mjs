// Content integrity checks: schema, nouns/articles, answers present, emoji, etc.
import fs from 'fs';
const dir='content/lessons'; const errs=[],warns=[]; const st={};
const emoji=/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;
for(let n=1;n<=66;n++){
  const f=`${dir}/${String(n).padStart(2,'0')}.json`;
  if(!fs.existsSync(f)){errs.push(`missing lesson ${n}`);continue;}
  let L; try{L=JSON.parse(fs.readFileSync(f,'utf8'))}catch(e){errs.push(`${n}: bad JSON`);continue;}
  const E=m=>errs.push(`L${n}: ${m}`), W=m=>warns.push(`L${n}: ${m}`);
  if(L.n!==n)E('n mismatch'); if(!L.title||!L.titleDe)E('title');
  if(!L.objectives?.length)E('objectives');
  if(emoji.test(JSON.stringify(L)))E('emoji');
  for(const v of L.vocab||[]){
    if(!v.de||!v.en)E('vocab incomplete '+JSON.stringify(v));
    if(/^(der|die|das) /.test(v.de)&&!v.pl)W('noun without plural: '+v.de);
    if(/^[A-ZÄÖÜ]/.test(v.de)&&!/^(der|die|das|ein|eine) /.test(v.de)&&!/[ ,!?]/.test(v.de)&&v.de.length>2)W('capitalised w/o article: '+v.de);
  }
  const ex=L.exercises||[]; let items=0;
  for(const e of ex){
    if(!['fill','translate','choose','reorder','match','answer'].includes(e.type))E('bad ex type '+e.type);
    if(!e.items?.length)E('empty exercise '+e.title);
    for(const i of e.items||[]){items++; if(!i.q||!i.a)E('item missing q/a in '+e.title); if(e.type==='fill'&&!/_{2,}/.test(i.q))W('fill without gap: '+i.q);}
  }
  if(n<66){ if(!ex.length)W('no exercises'); if(!L.summary?.length)W('no summary'); if(!L.comprehension?.length)W('no comprehension'); }
  for(const d of L.dialogues||[])for(const l of d.lines)if(!l.de||!l.en)E('dialogue line');
  st[n]={vocab:(L.vocab||[]).length,ex:items,gr:(L.grammar||[]).length,dlg:(L.dialogues||[]).length};
}
console.log('ERRORS',errs.length);errs.forEach(x=>console.log(' ',x));
console.log('WARNINGS',warns.length);warns.slice(0,60).forEach(x=>console.log(' ',x));
const tot=Object.values(st).reduce((a,b)=>({vocab:a.vocab+b.vocab,ex:a.ex+b.ex,gr:a.gr+b.gr,dlg:a.dlg+b.dlg}));console.log(tot);
fs.writeFileSync('content/_stats.json',JSON.stringify(st));
process.exit(errs.length?1:0);
