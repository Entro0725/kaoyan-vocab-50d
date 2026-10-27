import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { runInNewContext } from 'node:vm';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const match=html.match(/window\.__vocab=(\[[^\n]*\]);/);
assert.ok(match,'Inline vocabulary dataset exists');
const words=JSON.parse(match[1]);
assert.equal(words.length,4924,'Word count');
assert.equal(new Set(words.map(w=>w.word)).size,4924,'Unique headwords');
for(let i=0;i<words.length;i++){
  const w=words[i];
  assert.equal(w.id,i+1,'Stable original order');
  assert.ok(w.word&&w.meaning,'Complete definition');
  if(i)assert.ok(words[i-1].score>=w.score,'Frequency descending');
}
for(const [threshold,expected] of [[4,2393],[3,2873],[2,3642]]){
  assert.equal(words.filter(w=>w.score>=threshold).length,expected);
}
for(const feature of ['speechSynthesis','localStorage','scheduleCard','reviewTarget:100','reviewBatch:100','lapseMinutes:10','session.mode===\'practice\'','window.__kaoyanNativeTTS','native-tts.js']){
  assert.ok(html.includes(feature),'App feature present: '+feature);
}
const start=html.indexOf('const ONE_DAY=');
const end=html.indexOf('const STORAGE_KEY=');
assert.ok(start>0&&end>start,'Pure scheduling core is embedded');
const ctx={};
runInNewContext(html.slice(start,end)+';globalThis.__tests={scheduleCard,DEFAULT_SETTINGS,boundedSetting};',ctx,{timeout:4000});
const at=new Date('2026-10-27T08:00:00.000Z');
for(const minutes of [5,10,120]){
  const next=ctx.__tests.scheduleCard(null,0,at,{lapseMinutes:minutes});
  assert.equal(next.dueAt-at.getTime(),minutes*60000,'Configurable minutes');
}
assert.equal(ctx.__tests.boundedSetting(120,100,1,500),120);
console.log('PASS: 4924 ordered cards, custom review quotas, 5/10-minute lapses, native bridge');
