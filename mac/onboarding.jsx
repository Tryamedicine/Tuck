import React,{useState,useEffect} from 'react';
import Brand from './brand.jsx';
import ShortcutHint from './shortcut-hint.jsx';
import CaptureStory from './capture-story.jsx';
import {Ambient} from './figma-home.jsx';
import {Icon} from './ui.jsx';
import {exampleAsset} from './onboarding-example.mjs';
const api=window.shouxia;
export default function Onboarding({state,dispatch,renderCapture}){
 const [step,setStep]=useState(0),[name,setName]=useState(state.settings?.displayName||''),[endpoint,setEndpoint]=useState('https://dashscope.aliyuncs.com/compatible-mode/v1'),[key,setKey]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
 useEffect(()=>api.onEvent(e=>{if(e.type==='onboarding-capture')setStep(3)}),[]);
 async function saveName(value){setBusy(true);setError('');try{await dispatch({type:'settings',patch:{displayName:value}});setStep(2)}catch{setError('没有保存成功，请重试。')}finally{setBusy(false)}}
 async function saveApi(){setBusy(true);setError('');try{await api.configureRecognition({key,endpoint});setKey('');setStep(3)}catch{setError('请检查服务地址与 API Key。')}finally{setBusy(false)}}
 return <div className={'welcomeShade step-'+step} role="dialog" aria-modal="true" aria-labelledby="welcome-title"><Ambient welcome/><section className="welcomeCard"><header className="welcomeHeader"><Brand/>{step>0&&<span className="welcomeProgress">{step} / 3</span>}</header>
 {step===0?<div className="brandWelcome"><Brand large/><h2 id="welcome-title">截图或写一句，待办随手记。</h2><CaptureStory/><div className="welcomeActions"><button className="primary" onClick={()=>setStep(1)}>开始使用<Icon name="arrow"/></button></div></div>
 :step===1?<form className="nameStep" onSubmit={e=>{e.preventDefault();saveName(name)}}><div className="nameStepContent"><h2 id="welcome-title">怎么称呼你？</h2><input className="underlineInput nameInput" autoFocus aria-label="你的称呼" autoComplete="nickname" maxLength={32} placeholder="你的名字" value={name} onChange={e=>setName(e.target.value)}/>{error&&<p className="fieldError" role="alert">{error}</p>}</div><div className="welcomeActions"><button className="primary" disabled={busy||!name.trim()}>{busy?'保存中…':'继续'}</button><button type="button" className="skipStep" disabled={busy} onClick={()=>saveName('')}>暂时跳过</button></div></form>
 :step===2?<form className="apiStep" onSubmit={e=>{e.preventDefault();saveApi()}}><h2 id="welcome-title">连接你的 API</h2><div className="onboardFields"><label htmlFor="welcome-endpoint">服务地址</label><input className="underlineInput" id="welcome-endpoint" value={endpoint} onChange={e=>setEndpoint(e.target.value)}/><label htmlFor="welcome-key">API Key</label><input className="underlineInput" id="welcome-key" type="password" autoComplete="off" placeholder="输入个人 API Key" value={key} onChange={e=>setKey(e.target.value)}/><small>之后可在设置中更换</small>{error&&<p className="fieldError" role="alert">{error}</p>}</div><div className="welcomeActions"><button className="primary" disabled={busy||!key.trim()}>{busy?'保存中…':'下一步'}</button><button type="button" className="skipStep" onClick={()=>{setError('');setStep(3)}}>暂不配置</button></div></form>
 :<div className="exampleStep"><h2 id="welcome-title">试着收下一件事</h2>{renderCapture()}<div className="exampleBack"><button onClick={()=>setStep(2)}><Icon name="back" size={16}/>上一步</button><span>{state.draft?.asset?.url===exampleAsset.url?"示例体验":""}</span></div><ShortcutHint value={state.settings?.shortcut}/></div>}
 </section></div>;
}
