const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path');
const {Store}=require('./store.cjs');
test('local-time greeting boundaries and optional names',async()=>{
 const {greetingAt,greetingFor,countPhrase}=await import('./home-rules.mjs');
 for(const [hour,minute,expected] of [[4,59,'Good evening'],[5,0,'Good morning'],[11,59,'Good morning'],[12,0,'Good afternoon'],[17,59,'Good afternoon'],[18,0,'Good evening'],[23,59,'Good evening']])assert.equal(greetingAt(new Date(2026,9,31,hour,minute)),expected);
 assert.equal(greetingFor('  Shaw  ',new Date(2026,9,31,9)),'Good morning, Shaw');assert.equal(greetingFor('',new Date(2026,9,31,13)),'Good afternoon');
 assert.equal(countPhrase(0),'Free as a bird.');assert.equal(countPhrase(1),'One thing at a time.');assert.equal(countPhrase(12),'12 things to do');
});
test('display name persists independently without changing shortcut or onboarding',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'tuck-display-name-'));const s=new Store(dir);await s.init();const before=s.snapshot();await s.dispatch({type:'settings',patch:{displayName:'  Shaw  '}});
 let next=new Store(dir);await next.init();assert.equal(next.snapshot().settings.displayName,'Shaw');assert.equal(next.snapshot().settings.shortcut,before.settings.shortcut);assert.equal(next.snapshot().settings.onboardingCompleted,false);
 await assert.rejects(next.dispatch({type:'settings',patch:{displayName:'x'.repeat(33)}}));assert.equal(next.snapshot().settings.displayName,'Shaw');await next.dispatch({type:'settings',patch:{displayName:''}});assert.equal(next.snapshot().settings.displayName,'');
});

test('unfinished count mood changes at every tier boundary',async()=>{const {moodForCount}=await import('./home-rules.mjs');for(const [n,m] of [[0,'free'],[1,'easy'],[3,'easy'],[4,'focused'],[7,'focused'],[8,'attentive'],[10,'attentive'],[11,'busy'],[100,'busy']])assert.equal(moodForCount(n),m)});
