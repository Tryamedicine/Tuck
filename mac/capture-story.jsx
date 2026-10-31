import React,{useState,useEffect} from 'react';
import {Icon} from './ui.jsx';
import {exampleAsset,exampleTitle} from './onboarding-example.mjs';

export default function CaptureStory(){
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const [stage,setStage]=useState(reduced?'board':'capture'),[cycle,setCycle]=useState(0),[paused,setPaused]=useState(reduced),[typed,setTyped]=useState('');
 useEffect(()=>{if(paused||reduced)return;setStage('capture');const timers=[[1200,'scan'],[2500,'type'],[3900,'collect'],[4750,'board']].map(([ms,s])=>setTimeout(()=>setStage(s),ms));timers.push(setTimeout(()=>setCycle(v=>v+1),8500));return()=>timers.forEach(clearTimeout)},[cycle,paused,reduced]);
 useEffect(()=>{if(stage!=='type'){setTyped('');return}let i=0;setTyped('');const t=setInterval(()=>{i++;setTyped(exampleTitle.slice(0,i));if(i>=exampleTitle.length)clearInterval(t)},70);return()=>clearInterval(t)},[stage,cycle]);
 useEffect(()=>{if(reduced){setStage('board');setPaused(true)}},[reduced]);
 const capture=stage==='capture',scanning=stage==='scan',composing=['scan','type','collect'].includes(stage);
 return <div className="captureStory" data-stage={stage} data-cycle={cycle}>
 <div className="storyCanvas" role="img" aria-label="功能演示：截取聊天消息，识别成待办，收进双列清单">
 {(capture||scanning)&&<div className={'storyMessage '+(scanning?'messageInComposer':'')}><img src={exampleAsset.url} alt=""/>{capture&&<div className="storySelection"/>}{scanning&&<span className="storyScan"/>}</div>}
 {composing&&<div className={'storyComposer '+(stage==='collect'?'isCollecting':'')}>
 <div className="storyComposerHead"><Icon name="image" size={14}/><span>从截图里，找到一件事</span></div>
 {stage!=='scan'&&<img className="storyThumb" src={exampleAsset.url} alt=""/>}
 <div className="storyInput"><span>{stage==='scan'?'':stage==='type'?typed:exampleTitle}</span>{stage==='type'&&<i/>}<span className={'storySave '+(stage==='collect'?'isPressed':'')}>收下<Icon name="arrow" size={14}/></span></div>
 </div>}
 {stage==='collect'&&<div className="storyCollectedMark"><Icon name="inbox" size={20}/></div>}
 {stage==='board'&&<div className="storyBoard"><div className="storyBoardHeading"><div><small>Good morning</small><strong>One thing at a time.</strong></div><span>＋ 新建</span></div><div className="storyBoardColumns"><section><h3>待整理 <span>1</span></h3><div className="storyTask"><span className="storyCheckbox"/><div><strong>{exampleTitle}</strong><small>产品设计</small></div><Icon name="more" size={14}/></div></section><section><h3>今天要做 <span>0</span></h3><p>挑一件，开始今天</p></section></div></div>}
 </div>
 <div className="storyCaption"><span>{capture?'截取一段消息':scanning?'识别要做的事':stage==='type'?'也可以写一句，马上收下':stage==='collect'?'收下，放进待整理':'再留几件，给今天'}</span>{!reduced&&<button type="button" aria-label={paused?'重播功能演示':'暂停功能演示'} onClick={()=>{if(paused){setPaused(false);setCycle(v=>v+1)}else{setPaused(true);setStage('board')}}}><Icon name={paused?'undo':'pause'} size={14}/></button>}</div>
 </div>;
}
