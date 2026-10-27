import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const match=html.match(/window\.__vocab=(\[[^\n]*\]);/);
assert.ok(match,'Inline vocabulary dataset is present');
const words=JSON.parse(match[1]);
assert.equal(words.length,4924,'Word count');
assert.equal(new Set(words.map(w=>w.word)).size,4924,'Unique headwords');
assert.ok(html.includes('speechSynthesis'),'Pronunciation');
assert.ok(html.includes('localStorage'),'Saved progress');
assert.ok(html.includes('scheduleCard'),'Spaced repetition');
for(let i=0;i<words.length;i++){
 const w=words[i];
 assert.equal(w.id,i+1,'Stable original order');
 assert.ok(w.word&&w.meaning,'Complete definition');
 if(i)assert.ok(words[i-1].score>=w.score,'Frequency descending');
}
for(const [threshold,expected] of [[4,2393],[3,2873],[2,3642]])
 assert.equal(words.filter(w=>w.score>=threshold).length,expected);
console.log('PASS: 4924 ordered cards, frequency tiers, definitions and app features');
