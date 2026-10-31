const fs = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');

const clone = value => structuredClone(value);
const localDay = date => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
const UNDO_MS = 6500;
function title(value, allowEmpty = false) {
  if (typeof value !== 'string' || [...value].length > (allowEmpty?10000:100) || (!allowEmpty && !value.trim())) throw new Error(allowEmpty?'草稿不能超过 10000 个 Unicode 字符':'标题须为 1–100 个 Unicode 字符');
  return value;
}
function asset(value) {
  if (value === null) return null;
  const data=typeof value==='string'?{url:value}:value;
  if (!data || typeof data!=='object' || typeof data.url!=='string') throw new Error('图片格式无效');
  const normalized={url:data.url};
  for(const key of ['width','height']) if(data[key]!=null) {
    if(!Number.isInteger(data[key])||data[key]<1||data[key]>100000) throw new Error('图片尺寸无效');
    normalized[key]=data[key];
  }
  if(data.name!=null) {if(typeof data.name!=='string'||[...data.name].length>255) throw new Error('图片名称无效'); normalized.name=data.name;}
  const match = /^data:image\/(png|jpeg|webp|gif);base64,([A-Za-z0-9+/]+={0,2})$/.exec(data.url);
  if (!match || match[2].length > Math.ceil(20*1024*1024/3)*4) throw new Error('仅支持 20 MB 以内的 PNG、JPEG、WebP 或 GIF');
  const bytes = Buffer.from(match[2], 'base64');
  if (bytes.toString('base64') !== match[2] || bytes.length > 20*1024*1024) throw new Error('图片数据无效或超过 20 MB');
  const valid = {png:bytes.subarray(0,8).equals(Buffer.from('89504e470d0a1a0a','hex')),jpeg:bytes[0]===255 && bytes[1]===216 && bytes.at(-2)===255 && bytes.at(-1)===217,webp:bytes.toString('ascii',0,4)==='RIFF' && bytes.toString('ascii',8,12)==='WEBP',gif:['GIF87a','GIF89a'].includes(bytes.toString('ascii',0,6))}[match[1]];
  if (!valid) throw new Error('图片数据损坏');
  return normalized;
}
function fresh(day) {
  return {version:1, revision:0, tasks:[], draft:{title:'',asset:null}, settings:{shortcut:'Alt+N',onboardingCompleted:false,displayName:'',shortcutCoachPending:false,shortcutCoachSeen:false}, day, selectedIds:[], celebrated:false, guidanceShownDays:[], arrangedDays:[], rolloverInfo:null, receipts:[], undos:[]};
}
function validate(data) {
  if (data?.version !== 1 || !Number.isInteger(data.revision) || !Array.isArray(data.tasks) || typeof data.day !== 'string' || !data.draft || !data.settings || !['selectedIds','guidanceShownDays','arrangedDays','receipts','undos'].every(k=>Array.isArray(data[k]))) throw new Error('本地数据格式不受支持');
  title(data.draft.title,true); data.draft.asset=asset(data.draft.asset);
  const ids = new Set();
  for (const task of data.tasks) {
    if (!task.id || ids.has(task.id) || !['inbox','today','done'].includes(task.status)) throw new Error('事项数据损坏');
    ids.add(task.id); title(task.title); task.asset=asset(task.asset);
  }
  return data;
}
function place(state, task, status, index) {
  const rest = state.tasks.filter(t=>t.id!==task.id);
  const peers = rest.filter(t=>t.status===status);
  const position = index == null ? (status==='inbox'?0:peers.length) : Math.max(0,Math.min(peers.length, index));
  const before = peers[position];
  const at = before ? rest.findIndex(t=>t.id===before.id) : rest.length;
  state.tasks = [...rest.slice(0,at), {...task,status}, ...rest.slice(at)];
}
function rollover(state, day) {
  if (state.day === day) return;
  const oldDay = state.day;
  const returned = state.tasks.filter(t=>t.status==='today');
  state.tasks = [...returned.map(t=>({...t,status:'inbox'})),...state.tasks.filter(t=>t.status!=='today')];
  state.rolloverInfo = {from:oldDay,to:day,ids:returned.map(t=>t.id)};
  state.day = day; state.selectedIds = []; state.celebrated = false;
}
class Store {
  constructor(directory,{now=()=>new Date()}={}) {
    this.directory=directory; this.file=path.join(directory,'store.json'); this.backup=path.join(directory,'store.backup.json'); this.now=now; this.state=null; this.queue=Promise.resolve(); this.recoveryNotice=null;
  }
  async init() {
    await fs.mkdir(this.directory,{recursive:true,mode:0o700});
    let data, primaryError;
    try { data=validate(JSON.parse(await fs.readFile(this.file,'utf8'))); } catch(error) { primaryError=error; }
    if (!data) {
      try { data=validate(JSON.parse(await fs.readFile(this.backup,'utf8'))); this.recoveryNotice='已从本地备份恢复数据，请检查最近一次修改。'; } catch(error) {
        if (primaryError?.code!=='ENOENT' || error.code!=='ENOENT') throw new Error('本地事项文件无法读取；已保留原文件，请勿覆盖。');
        data=fresh(localDay(this.now()));
      }
      await this.write(data, false);
    }
    if(data.settings.onboardingCompleted===undefined)data.settings.onboardingCompleted=data.tasks.length>0;
    if(data.settings.shortcut==='CommandOrControl+Shift+Space')data.settings.shortcut='Alt+N';
    this.state=data;
    await this.dispatch({type:'rollover'});
    return this.snapshot();
  }
  snapshot() { if (!this.state) throw new Error('数据尚未初始化'); return clone(this.state); }
  async write(data, backup=true) {
    const temp=path.join(this.directory,`store-${randomUUID()}.tmp`);
    let handle;
    try {
      handle=await fs.open(temp,'wx',0o600); await handle.writeFile(JSON.stringify(data)); await handle.sync(); await handle.close(); handle=null;
      if (backup && this.state) {
        const backupTemp=path.join(this.directory,`backup-${randomUUID()}.tmp`);
        try { await fs.writeFile(backupTemp,JSON.stringify(this.state),{mode:0o600}); await fs.rename(backupTemp,this.backup); } finally { await fs.unlink(backupTemp).catch(()=>{}); }
      }
      await fs.rename(temp,this.file);
    } finally { if(handle) await handle.close().catch(()=>{}); await fs.unlink(temp).catch(()=>{}); }
  }
  dispatch(action) {
    const run=this.queue.then(()=>this.apply(action)); this.queue=run.catch(()=>{}); return run;
  }
  async apply(action) {
    if (!action || typeof action.type!=='string') throw new Error('无效操作');
    const state=this.snapshot(), now=this.now(), time=now.getTime(), day=localDay(now), result={};
    const previousDay=state.day;
    rollover(state,day);
    if(previousDay!==day) result.rolledOver=clone(state.rolloverInfo);
    state.undos=state.undos.filter(u=>u.expiresAt>time);
    const task=state.tasks.find(t=>t.id===action.id);
    const requireTask=()=>{if(!task) throw new Error('事项不存在'); return task;};
    const undo=(kind,record)=> {const token=randomUUID(); state.undos.push({token,kind,...record,expiresAt:time+UNDO_MS,day}); result.undoToken=token;};
    const location=()=>({status:task.status,index:state.tasks.filter(t=>t.status===task.status).findIndex(t=>t.id===task.id)});
    switch(action.type) {
      case 'rollover': break;
      case 'draft': {
        const patch=action.patch||{};
        if ('title' in patch) state.draft.title=title(patch.title,true);
        if ('asset' in patch) state.draft.asset=asset(patch.asset);
        break;
      }
      case 'create': {
        if (typeof action.requestId!=='string' || !action.requestId || action.requestId.length>200) throw new Error('缺少有效收下请求标识');
        const receipt=state.receipts.find(r=>r.requestId===action.requestId);
        if (receipt) {result.createdId=receipt.id; result.duplicate=true; break;}
        title(state.draft.title);
        const created={id:randomUUID(),title:state.draft.title,asset:state.draft.asset,project:null,status:'inbox',createdAt:time,completedAt:null};
        state.tasks.unshift(created); undo('create',{id:created.id,draft:clone(state.draft)});
        state.draft={title:'',asset:null}; state.receipts.push({requestId:action.requestId,id:created.id});
        result.createdId=created.id; result.notice='已收下'; break;
      }
      case 'move': {
        if(action.expectedDay!=null && action.expectedDay!==day) {
          result.notice='日期已变化，此次拖动已取消'; result.cancelled=true; break;
        }
        requireTask(); if(task.status==='done' || !['inbox','today'].includes(action.status)) throw new Error('无法移动此事项');
        if(action.index!=null && (!Number.isInteger(action.index)||action.index<0)) throw new Error('排序位置无效');
        place(state,task,action.status,action.index);
        if(action.status==='today') {
          if(!state.selectedIds.includes(task.id)) state.selectedIds.push(task.id);
          if(!state.arrangedDays.includes(day)) state.arrangedDays.push(day);
          state.celebrated=false;
        }
        break;
      }
      case 'complete': {
        requireTask(); if(task.status==='done') break;
        undo('complete',{id:task.id,location:location()});
        const wasToday=task.status==='today'; task.status='done'; task.completedAt=time;
        if(wasToday && state.selectedIds.length && state.selectedIds.every(id=>state.tasks.some(t=>t.id===id && t.status==='done'))) {
          state.celebrated=true; result.celebration=true; result.notice='今天安排的事项都完成了';
        } else result.notice='已完成';
        break;
      }
      case 'restore': {
        requireTask(); if(task.status!=='done') throw new Error('只有已完成事项可以恢复');
        place(state,{...task,completedAt:null},'inbox',0); state.celebrated=false; result.notice='已恢复到待整理'; break;
      }
      case 'delete': {
        requireTask(); undo('delete',{task:clone(task),location:location()}); state.tasks=state.tasks.filter(t=>t.id!==task.id); state.celebrated=false; result.notice='已删除'; break;
      }
      case 'undo': {
        const record=state.undos.find(u=>u.token===action.token); if(!record) throw new Error('撤销已过期');
        if(record.kind==='create') {
          if(state.draft.title || state.draft.asset) throw new Error('已有另一份草稿，请在主窗口编辑或删除该事项');
          if(!state.tasks.some(t=>t.id===record.id)) throw new Error('事项已不存在');
          state.tasks=state.tasks.filter(t=>t.id!==record.id); state.draft=record.draft;
        } else {
          const current=state.tasks.find(t=>t.id===record.id);
          if(record.kind==='complete' && (!current || current.status!=='done')) throw new Error('事项状态已变化，无法撤销');
          if(record.kind==='delete' && state.tasks.some(t=>t.id===record.task.id)) throw new Error('事项已恢复');
          const restored=record.kind==='delete'?record.task:{...current,completedAt:null};
          const target=record.location.status==='today' && record.day!==day?'inbox':record.location.status;
          place(state,restored,target,target!==record.location.status?0:record.location.index);
        }
        state.undos=state.undos.filter(u=>u.token!==record.token); state.celebrated=false; result.notice='已撤销'; break;
      }
      case 'edit': {
        requireTask(); const patch=action.patch||{};
        if('title' in patch) task.title=title(patch.title);
        if('project' in patch) {if(patch.project!==null && (typeof patch.project!=='string'||[...patch.project].length>100)) throw new Error('项目名称无效'); task.project=patch.project;}
        break;
      }
      case 'settings': {
        const patch=action.patch||{};
        if('shortcut' in patch){const shortcut=patch.shortcut;if(typeof shortcut!=='string'||shortcut.length>100)throw new Error('快捷键设置无效');state.settings.shortcut=shortcut;}
        if('displayName' in patch){if(typeof patch.displayName!=='string'||[...patch.displayName].length>32||/[\u0000-\u001f\u007f]/u.test(patch.displayName))throw new Error('称呼须在 32 个字以内');state.settings.displayName=patch.displayName.trim();}
        break;
      }
      case 'onboarding': {
        if(typeof action.completed!=='boolean') throw new Error('引导状态无效');
        state.settings.onboardingCompleted=action.completed;if(action.completed&&!state.settings.shortcutCoachSeen)state.settings.shortcutCoachPending=true;break;
      }
      case 'shortcut-coach-shown': {state.settings.shortcutCoachSeen=true;state.settings.shortcutCoachPending=false;break;}
      case 'activate': {
        if(!state.guidanceShownDays.includes(day) && !state.arrangedDays.includes(day)) {
          const info=state.rolloverInfo, count=info?.to===day?info.ids.filter(id=>state.tasks.some(t=>t.id===id && t.status==='inbox')).length:0;
          const yesterday=new Date(now); yesterday.setDate(yesterday.getDate()-1);
          const prefix=info?.from===localDay(yesterday)?'昨天':'上次';
          result.guidance={title:'今天，想做些什么？',body:count?`${prefix}未完成的 ${count} 件事已回到待整理，选几件开始吧。`:state.tasks.some(t=>t.status==='inbox')?'':'先收下一件事吧'};
          state.guidanceShownDays.push(day);
        }
        break;
      }
      default: throw new Error('不支持的操作');
    }
    if(JSON.stringify(state)!==JSON.stringify(this.state)) {
      state.revision=this.state.revision+1; await this.write(state); this.state=state;
    }
    return {state:this.snapshot(),...result};
  }
}
module.exports={Store,localDay,UNDO_MS};
