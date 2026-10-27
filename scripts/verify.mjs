import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { runInNewContext } from 'node:vm';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const match=html.match(/window\.__vocab=(\[[^\n]*\]);/);
assert.ok(match,'Inline vocabulary data exists');
const words=JSON.parse(match[1]);
assert.equal(words.length,4924,'Total headwords');
assert.equal(new Set(words.map(w=>w.word)).size,4924,'Unique headwords');
for(let i=0;i<words.length;i++){
  const w=words[i];
  assert.equal(w.id,i+1,'Original stable order');
  assert.ok(w.word&&w.meaning,'Meaning is preserved');
  if(i)assert.ok(words[i-1].score>=w.score,'Frequency-descending order');
}
for(const [threshold,count] of [[4,2393],[3,2873],[2,3642]]){
  assert.equal(words.filter(w=>w.score>=threshold).length,count);
}
for(const feature of ['speechSynthesis','SpeechSynthesisUtterance','localStorage','scheduleCard','reviewTarget:100','reviewBatch:100','lapseMinutes:10',"session.mode==='practice'",'data-action="export"']){
  assert.ok(html.includes(feature),'Required feature '+feature);
}
for(const removed of ['__kaoyanNativeTTS','__kaoyanOfflineSpeech','offline-audio.js','native-tts.js','downloads/kaoyan-vocab-50d.apk']){
  assert.ok(!html.includes(removed),'Removed obsolete resource: '+removed);
}
assert.ok(html.includes("kaoyan-vocab-50d-progress-v1"),'Original progress storage key kept unchanged');
const begin=html.indexOf('const ONE_DAY=');
const stop=html.indexOf('const STORAGE_KEY=');
assert.ok(begin>=0&&stop>begin,'Spaced-repetition core');
const context={};
runInNewContext(html.slice(begin,stop)+';globalThis.TESTS={scheduleCard,boundedSetting};',context,{timeout:4000});
const date=new Date('2026-10-27T08:00:00.000Z');
for(const minutes of [5,10,120]){
  const next=context.TESTS.scheduleCard(null,0,date,{lapseMinutes:minutes});
  assert.equal(next.dueAt-date.getTime(),minutes*60000,'Configurable failed-word review interval');
}
assert.equal(context.TESTS.boundedSetting(120,100,1,500),120,'Review target 120');
console.log('PASS: 4924 words, preserved order, review 100/120, 5/10-minute review, browser TTS, web-only build');
