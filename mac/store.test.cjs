const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const os=require('node:os');
const path=require('node:path');
const {Store}=require('./store.cjs');
async function setup(t,date='2026-10-25T12:00:00') {
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'shouxia-store-'));
  t.after(()=>fs.rm(dir,{recursive:true,force:true}));
  let clock=new Date(date); const now=()=>new Date(clock);
  const store=new Store(dir,{now}); await store.init();
  return {store,dir,now,setDate:value=>{clock=new Date(value);}};
}
async function create(store,title='事项',requestId=crypto.randomUUID()) {
  await store.dispatch({type:'draft',patch:{title}});
  return store.dispatch({type:'create',requestId});
}
test('empty initial state, serialized creation, idempotency and restart draft/image persistence',async t=>{
  const {store,dir,now}=await setup(t);
  assert.deepEqual(store.snapshot().tasks,[]);
  const png='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aP9sAAAAASUVORK5CYII=';
  await store.dispatch({type:'draft',patch:{title:'截图事项',asset:png}});
  const results=await Promise.all(Array.from({length:10},()=>store.dispatch({type:'create',requestId:'one'})));
  assert.equal(new Set(results.map(r=>r.createdId)).size,1); assert.equal(store.snapshot().tasks.length,1);
  await store.dispatch({type:'draft',patch:{title:'待编辑',asset:png}});
  const restarted=new Store(dir,{now}); await restarted.init();
  assert.equal(restarted.snapshot().draft.title,'待编辑'); assert.equal(restarted.snapshot().draft.asset.url,png);
  assert.equal((await restarted.dispatch({type:'create',requestId:'one'})).duplicate,true);
  assert.equal(restarted.snapshot().draft.title,'待编辑');
});
test('five planned, four done: cross-day preserves records, inbox order, created times and draft',async t=>{
  const {store,setDate}=await setup(t); const ids=[];
  const inbox=(await create(store,'原待整理')).createdId;
  for(let n=0;n<5;n++) {const id=(await create(store,`事项${n}`)).createdId;ids.push(id);await store.dispatch({type:'move',id,status:'today'});}
  for(const id of ids.slice(0,4)) assert.notEqual((await store.dispatch({type:'complete',id})).celebration,true);
  const original=store.snapshot().tasks.find(t=>t.id===ids[4]);
  await store.dispatch({type:'draft',patch:{title:'跨午夜编辑'}});
  setDate('2026-10-26T00:00:01'); await store.dispatch({type:'rollover'});
  const state=store.snapshot(); assert.equal(state.tasks.filter(t=>t.status==='done').length,4);
  assert.equal(state.tasks.filter(t=>t.status==='today').length,0);
  assert.deepEqual(state.tasks.filter(t=>t.status==='inbox').map(t=>t.id),[ids[4],inbox]);
  assert.equal(state.tasks.find(t=>t.id===ids[4]).createdAt,original.createdAt); assert.equal(state.draft.title,'跨午夜编辑');
  const revision=state.revision; await store.dispatch({type:'rollover'});assert.equal(store.snapshot().revision,revision);
  assert.match((await store.dispatch({type:'activate'})).guidance.body,/昨天未完成的 1 件/);
});
test('guidance persistent once per date, count only returned still in inbox, planning suppresses',async t=>{
  const {store,dir,now,setDate}=await setup(t);
  assert.equal((await store.dispatch({type:'activate'})).guidance.body,'先收下一件事吧');
  assert.equal((await store.dispatch({type:'activate'})).guidance,undefined);
  const restarted=new Store(dir,{now}); await restarted.init();assert.equal((await restarted.dispatch({type:'activate'})).guidance,undefined);
  const id=(await create(store)).createdId;await store.dispatch({type:'move',id,status:'today'});
  setDate('2026-10-29T12:00:00');await store.dispatch({type:'rollover'});
  assert.match((await store.dispatch({type:'activate'})).guidance.body,/上次未完成的 1 件/);
  setDate('2026-10-30T12:00:00');await store.dispatch({type:'move',id,status:'today'}); await store.dispatch({type:'move',id,status:'inbox'});
  assert.equal((await store.dispatch({type:'activate'})).guidance,undefined);
  setDate('2026-10-25T13:00:00'); assert.equal((await store.dispatch({type:'activate'})).guidance,undefined);
});
test('complete celebration requires whole selected set; move/delete never count as completion',async t=>{
  const {store}=await setup(t); const a=(await create(store)).createdId,b=(await create(store)).createdId;
  for(const id of [a,b]) await store.dispatch({type:'move',id,status:'today'});
  await store.dispatch({type:'move',id:a,status:'inbox'});
  assert.equal((await store.dispatch({type:'complete',id:b})).celebration,undefined);
  await store.dispatch({type:'move',id:a,status:'today'});
  const completed=await store.dispatch({type:'complete',id:a});assert.equal(completed.celebration,true);
  await store.dispatch({type:'undo',token:completed.undoToken}); assert.equal(store.snapshot().celebrated,false);
  assert.equal((await store.dispatch({type:'complete',id:a})).celebration,true);
  await store.dispatch({type:'restore',id:b});assert.equal(store.snapshot().tasks.find(t=>t.id===b).status,'inbox');
});
test('completion/delete undo across midnight returns inbox, done deletion preserves completion time',async t=>{
  const {store,setDate}=await setup(t,'2026-10-25T23:59:58'); const a=(await create(store)).createdId,b=(await create(store)).createdId;
  for(const id of [a,b]) await store.dispatch({type:'move',id,status:'today'});
  const completed=await store.dispatch({type:'complete',id:a}),deleted=await store.dispatch({type:'delete',id:b});
  setDate('2026-10-26T00:00:01');await store.dispatch({type:'undo',token:completed.undoToken});await store.dispatch({type:'undo',token:deleted.undoToken});
  assert.ok(store.snapshot().tasks.every(t=>t.status==='inbox'));
  await store.dispatch({type:'complete',id:a});const stamp=store.snapshot().tasks.find(t=>t.id===a).completedAt;
  const removed=await store.dispatch({type:'delete',id:a});await store.dispatch({type:'undo',token:removed.undoToken});
  assert.equal(store.snapshot().tasks.find(t=>t.id===a).completedAt,stamp);assert.equal(store.snapshot().tasks.find(t=>t.id===a).status,'done');
});
test('creation undo protects a different draft, restores original, expires at 6.5 seconds',async t=>{
  const {store,setDate}=await setup(t);const saved=await create(store,'原草稿');
  await store.dispatch({type:'draft',patch:{title:'新草稿'}});await assert.rejects(store.dispatch({type:'undo',token:saved.undoToken}),/另一份/);
  await store.dispatch({type:'draft',patch:{title:''}});await store.dispatch({type:'undo',token:saved.undoToken});assert.equal(store.snapshot().draft.title,'原草稿');assert.equal(store.snapshot().tasks.length,0);
  const another=await create(store);setDate('2026-10-25T12:00:06.500');await assert.rejects(store.dispatch({type:'undo',token:another.undoToken}),/过期/);
});
test('Unicode title and malformed assets reject without changing draft',async t=>{
  const {store}=await setup(t);
  await store.dispatch({type:'draft',patch:{title:'😀'.repeat(100)}});
  await store.dispatch({type:'draft',patch:{title:'😀'.repeat(101)}});
  await assert.rejects(store.dispatch({type:'create',requestId:'long'}));
  const before=store.snapshot();await assert.rejects(store.dispatch({type:'draft',patch:{title:'😀'.repeat(10001)}}));
  for(const asset of ['file:///private/data','data:image/png;base64,AAAA','data:image/svg+xml;base64,AAAA','blob:test']) await assert.rejects(store.dispatch({type:'draft',patch:{asset}}));
  assert.deepEqual(store.snapshot(),before);
  await store.dispatch({type:'draft',patch:{title:' \n '}}); await assert.rejects(store.dispatch({type:'create',requestId:'blank'}));
});
test('disk write failure leaves state and draft intact; retry succeeds without duplicate',async t=>{
  const {store,dir}=await setup(t);await store.dispatch({type:'draft',patch:{title:'保存失败'}});const before=store.snapshot();
  const realFile=store.file;store.file=path.join(dir,'missing-parent','store.json');
  await assert.rejects(store.dispatch({type:'create',requestId:'retry'}));assert.deepEqual(store.snapshot(),before);
  store.file=realFile;await store.dispatch({type:'create',requestId:'retry'});assert.equal(store.snapshot().tasks.length,1);
});
test('corrupted primary recovers backup; unreadable pair is retained and rejected',async t=>{
  const {store,dir,now}=await setup(t);const id=(await create(store,'保留事项')).createdId;
  await store.dispatch({type:'draft',patch:{title:'最后修改'}});
  await fs.writeFile(store.file,'{corrupted');const recovered=new Store(dir,{now});await recovered.init();
  assert.equal(recovered.snapshot().tasks[0].id,id);assert.ok(recovered.recoveryNotice);
  await fs.writeFile(recovered.file,'{bad');await fs.writeFile(recovered.backup,'{bad backup');
  await assert.rejects(new Store(dir,{now}).init(),/保留原文件/);assert.equal(await fs.readFile(recovered.file,'utf8'),'{bad');
});
test('explicit ordering, same-day undo position, multi-day return group is stable',async t=>{
  const {store,setDate}=await setup(t);const ids=[];
  for(let n=0;n<4;n++) ids.push((await create(store,`事项${n}`)).createdId);
  for(const id of ids.slice(0,3)) await store.dispatch({type:'move',id,status:'today'});
  await store.dispatch({type:'move',id:ids[2],status:'today',index:0});
  const order=()=>store.snapshot().tasks.filter(t=>t.status==='today').map(t=>t.id);
  assert.deepEqual(order(),[ids[2],ids[0],ids[1]]);
  const deleted=await store.dispatch({type:'delete',id:ids[0]});await store.dispatch({type:'undo',token:deleted.undoToken});
  assert.deepEqual(order(),[ids[2],ids[0],ids[1]]);
  setDate('2026-11-01T12:00:00');await store.dispatch({type:'rollover'});
  assert.deepEqual(store.snapshot().tasks.filter(t=>t.status==='inbox').map(t=>t.id),[ids[2],ids[0],ids[1],ids[3]]);
  await store.dispatch({type:'complete',id:ids[0]});
  assert.match((await store.dispatch({type:'activate'})).guidance.body,/上次未完成的 2 件/);
});
test('deleting a selected task cannot cause celebration; rejected edit does not break queue',async t=>{
  const {store}=await setup(t);const a=(await create(store)).createdId,b=(await create(store)).createdId;
  for(const id of [a,b]) await store.dispatch({type:'move',id,status:'today'});
  await store.dispatch({type:'delete',id:a});
  assert.equal((await store.dispatch({type:'complete',id:b})).celebration,undefined);
  await assert.rejects(store.dispatch({type:'edit',id:b,patch:{title:''}}));
  await store.dispatch({type:'edit',id:b,patch:{title:'有效标题',project:'项目'}});
  assert.equal(store.snapshot().tasks[0].title,'有效标题');
});
test('stale drag is cancelled while rollover persists; fresh-day move remains available',async t=>{
  const {store,setDate,dir,now}=await setup(t,'2026-10-25T23:59:59');
  const a=(await create(store,'昨日事项')).createdId,b=(await create(store,'原待整理')).createdId;
  await store.dispatch({type:'move',id:a,status:'today'});
  const expectedDay=store.snapshot().day;
  setDate('2026-10-26T00:00:01');
  const stale=await store.dispatch({type:'move',id:b,status:'today',index:0,expectedDay});
  assert.equal(stale.cancelled,true);assert.equal(stale.notice,'日期已变化，此次拖动已取消');
  assert.deepEqual(stale.rolledOver,{from:'2026-10-25',to:'2026-10-26',ids:[a]});
  assert.equal(stale.state.day,'2026-10-26');
  assert.deepEqual(stale.state.tasks.filter(t=>t.status==='inbox').map(t=>t.id),[a,b]);
  assert.deepEqual(stale.state.selectedIds,[]);
  const restarted=new Store(dir,{now});await restarted.init();
  assert.deepEqual(restarted.snapshot(),stale.state);
  const again=await restarted.dispatch({type:'move',id:a,status:'today',expectedDay});assert.equal(again.cancelled,true);
  assert.equal(again.state.revision,stale.state.revision);
  const current=await restarted.dispatch({type:'move',id:b,status:'today',expectedDay:'2026-10-26'});
  assert.equal(current.state.tasks.find(t=>t.id===b).status,'today');assert.equal(current.cancelled,undefined);
});
