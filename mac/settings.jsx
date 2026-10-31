import React,{useState,useEffect,useRef} from 'react';
import {Icon,PageHeader,SettingRow} from './ui.jsx';
const api=window.shouxia;
const formatShortcut=value=>(value||'').replace('CommandOrControl','⌘').replace('Command','⌘').replace('Control','⌃').replace('Shift','⇧').replace('Alt','⌥').replaceAll('+',' ');

export default function Settings({state,dispatch,error}){
 const [page,setPage]=useState('root'),[name,setName]=useState(state.settings?.displayName||''),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false);
 const [recognition,setRecognition]=useState({configured:false,endpoint:''}),[endpoint,setEndpoint]=useState('https://dashscope.aliyuncs.com/compatible-mode/v1'),[key,setKey]=useState(''),[apiError,setApiError]=useState('');
 const [editingShortcut,setEditingShortcut]=useState(false),[shortcut,setShortcut]=useState(''),[knowledge,setKnowledge]=useState(null),[memoryError,setMemoryError]=useState(''),[selfName,setSelfName]=useState(''),[relation,setRelation]=useState(null);
 const scroll=useRef();
 useEffect(()=>{api.recognitionStatus().then(r=>{setRecognition(r);if(r.endpoint)setEndpoint(r.endpoint)}).catch(()=>setApiError('无法读取识别配置。'))},[]);
 useEffect(()=>setName(state.settings?.displayName||''),[state.settings?.displayName]);
 useEffect(()=>{scroll.current?.scrollTo(0,0);setNotice('')},[page]);
 const back=()=>{setPage('root');setKey('');setApiError('');setRelation(null)};
 async function loadMemory(){setPage('memory');setMemoryError('');try{const v=await api.knowledgeGet();setKnowledge(v);setSelfName(v.selfName)}catch{setMemoryError('无法读取记忆，请重试。')}}
 async function memoryUpdate(patch){setBusy(true);setMemoryError('');try{const v=await api.knowledgeSettings(patch);setKnowledge(v);setSelfName(v.selfName);setNotice('已保存')}catch{setMemoryError('没有保存成功，请重试。')}finally{setBusy(false)}}
 async function forget(id){setBusy(true);try{setKnowledge(await api.knowledgeRemove(id));setNotice('已移除这条记忆')}catch{setMemoryError('没有移除成功，请重试。')}finally{setBusy(false)}}
 async function saveRelation(){setBusy(true);try{setKnowledge(await api.knowledgeEdit(relation));setRelation(null);setNotice('关系已更新')}catch{setMemoryError('没有保存成功，请检查人物与项目。')}finally{setBusy(false)}}
 async function saveShortcut(value){setBusy(true);try{await dispatch({type:'settings',patch:{shortcut:value}});setEditingShortcut(false);setNotice('快捷键已更新')}catch{}finally{setBusy(false)}}
 async function saveRecognition(){setBusy(true);setApiError('');try{setRecognition(await api.configureRecognition({key,endpoint}));setKey('');setNotice('识别配置已保存');setPage('root')}catch{setApiError('保存失败，请检查服务地址、密钥与 Mac 安全存储。')}finally{setBusy(false)}}
 const memoryGroup=(title,items,kind)=>items.length>0&&<section className="memoryGroup"><h2>{title}<span>{items.length}</span></h2>{items.map(item=><div className="memoryItem" key={item.id}><span className="memoryItemIcon"><Icon name={kind}/></span><div className="memoryItemContent"><strong>{item.name||item.text||`${item.person} · ${item.project}`}</strong>{item.evidence&&<small>{item.evidence}</small>}</div><div className="memoryItemActions">{kind==='link'&&<button onClick={()=>setRelation({id:item.id,person:item.person,project:item.project})}>编辑</button>}<button disabled={busy} onClick={()=>forget(item.id)}>{kind==='undo'?'重新提示':'忘记'}</button></div></div>)}</section>;
 const total=knowledge?knowledge.people.length+knowledge.facts.length+knowledge.relations.length:0;
 return <main className="nativeSettings">
 <PageHeader title={page==='root'?'Tuck 设置':page==='recognition'?'截图识别':'知识记忆'} onBack={page!=='root'?back:null} action={page==='recognition'?<button className="primary" disabled={busy||!key.trim()} onClick={saveRecognition}>{busy?'保存中…':'保存'}</button>:null}/>
 <div className="settingsContent" ref={scroll}>
 {page==='root'?<>
 <SettingRow title="你的称呼" description="用于首页问候"><form className="profileNameEditor" onSubmit={async e=>{e.preventDefault();setBusy(true);try{await dispatch({type:'settings',patch:{displayName:name}});setNotice('称呼已保存')}catch{}finally{setBusy(false)}}}><input aria-label="你的称呼" value={name} maxLength={32} placeholder="怎么称呼你？" onChange={e=>setName(e.target.value)}/><button disabled={busy||name===(state.settings?.displayName||'')}>保存</button></form></SettingRow>
 <SettingRow title="快捷收集" description="在其他应用中打开新建窗口"><div className="shortcutControls">{editingShortcut?<input id="shortcut" className="shortcutRecorder" aria-label="快捷收集组合键" autoFocus readOnly value={formatShortcut(shortcut)} onKeyDown={e=>{if(e.key==='Escape'){e.preventDefault();setEditingShortcut(false);return}if(['Meta','Control','Alt','Shift'].includes(e.key))return;if(e.key==='Enter'){e.preventDefault();if(shortcut)saveShortcut(shortcut);return}if(e.metaKey||e.ctrlKey||e.altKey){e.preventDefault();setShortcut([e.metaKey?'Command':null,e.ctrlKey?'Control':null,e.altKey?'Alt':null,e.shiftKey?'Shift':null,e.code==='Space'?'Space':e.key.length===1?e.key.toUpperCase():e.key].filter(Boolean).join('+'))}}}/>:<kbd>{formatShortcut(state.settings?.shortcut)||'已停用'}</kbd>}<div>{editingShortcut?<><button onClick={()=>setEditingShortcut(false)}>取消</button><button disabled={busy||!shortcut} onClick={()=>saveShortcut(shortcut)}>保存</button></>:<><button aria-label="更改快捷键" onClick={()=>{setShortcut(state.settings?.shortcut||'');setEditingShortcut(true)}}>更改</button><button disabled={busy} onClick={()=>saveShortcut(state.settings?.shortcut?'':'Alt+N')}>{state.settings?.shortcut?'停用':'启用'}</button></>}</div></div></SettingRow>

 <SettingRow title="截图识别" description={recognition.configured?'已配置个人服务':'未配置 · 也可手动收下'}><button className="rowNavigation" aria-label="配置截图识别" onClick={()=>setPage('recognition')}>{recognition.configured?'管理':'配置'}<Icon name="chevron" size={16}/></button></SettingRow>
 <SettingRow title="知识记忆" description="管理已确认的人物、项目和关系"><button className="rowNavigation" aria-label="查看知识记忆" onClick={loadMemory}>查看<Icon name="chevron" size={16}/></button></SettingRow>
 <SettingRow title="使用引导" description="重新认识 Tuck 的收集方式"><button className="rowNavigation" onClick={()=>api.reopenOnboarding()}>查看<Icon name="chevron" size={16}/></button></SettingRow>

 </>:page==='recognition'?<section className="recognitionPage">
 <div className="formFields"><label htmlFor="endpoint">服务地址</label><input id="endpoint" value={endpoint} onChange={e=>setEndpoint(e.target.value)}/><label htmlFor="api-key">API Key</label><input id="api-key" type="password" autoComplete="off" value={key} onChange={e=>setKey(e.target.value)} placeholder={recognition.configured?'输入新密钥以更换':'输入个人 API Key'}/><small className="subtleNote">可随时更换 API Key</small></div>{apiError&&<p className="fieldError" role="alert">{apiError}</p>}
 </section>:<section className="memoryPage">
 {memoryError&&<p className="fieldError" role="alert">{memoryError}<button onClick={loadMemory}>重试</button></p>}
 {!knowledge&&!memoryError?<p role="status">正在读取…</p>:knowledge&&<>
 <SettingRow title="使用知识记忆" description="只使用你确认的信息"><button className={'switch '+(knowledge.enabled?'isOn':'')} role="switch" aria-label="使用知识记忆" aria-checked={knowledge.enabled} disabled={busy} onClick={()=>memoryUpdate({enabled:!knowledge.enabled})}><span/></button></SettingRow>
 <section className="memoryIdentity"><h2>在截图中识别我</h2><p>用于判断哪些事情与你有关，与首页称呼分开。</p><form className="selfNameRow" onSubmit={e=>{e.preventDefault();memoryUpdate({selfName})}}><input id="self-name" aria-label="在截图中的名字" value={selfName} maxLength={32} placeholder="你在聊天中使用的名字" onChange={e=>setSelfName(e.target.value)}/><button disabled={busy||selfName===knowledge.selfName}>保存</button></form></section>
 <div className="memorySectionTitle"><h2>已确认的记忆</h2><span>{total}</span></div>
 {total===0?<div className="knowledgeEmpty"><Icon name="brain" size={28}/><h3>还没有记忆</h3><p>确认截图中的线索后，会收在这里。</p></div>:<>{memoryGroup('人物',knowledge.people,'person')}{memoryGroup('项目与事情',knowledge.facts,'folder')}{memoryGroup('人物与项目',knowledge.relations,'link')}</>}
 {relation&&<form className="relationEditor" onSubmit={e=>{e.preventDefault();saveRelation()}}><h3>编辑关系</h3><label>人物<input value={relation.person} maxLength={32} onChange={e=>setRelation({...relation,person:e.target.value})}/></label><label>项目<input value={relation.project} maxLength={80} onChange={e=>setRelation({...relation,project:e.target.value})}/></label><div><button type="button" onClick={()=>setRelation(null)}>取消</button><button className="primary" disabled={busy}>保存</button></div></form>}
 {memoryGroup('已忽略的线索',knowledge.ignored||[],'undo')}
 <p className="knowledgePrivacy"><Icon name="shield" size={16}/>记忆保存在本机；关闭后不参与识别。</p>
 </>}
 </section>}
 {notice&&<p className="settingsStatus" role="status">{notice}</p>}{error&&<p className="fieldError" role="alert">{error}</p>}
 </div></main>;
}
