import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import redLight from "./assets/figma/imgEllipse1.svg";
import violetLight from "./assets/figma/imgEllipse2.svg";
import geometry from "./dot-geometry.json";
import { greetingFor, countPhrase, moodForCount } from "./home-rules.mjs";
import { moodAssets } from "./mood-assets.mjs";
export function Ambient({ welcome = false }) {
  const canvas = useRef(null), coordinates = useRef(null);
  useEffect(() => {
    const resize = () => coordinates.current?.style.setProperty("--ambient-scale", String(window.innerWidth / 1400));
    resize();
    window.addEventListener("resize", resize);
    const el = canvas.current, ctx = el.getContext("2d"), media = matchMedia("(prefers-reduced-motion: reduce)");
    let frame;
    const dots = geometry.map(([x, y, w], i) => {
      const v = Math.sin(i * 127.1 + x * 0.017 + y * 0.031) * 43758.5453;
      return { x, y, r: w / 2, phase: (v - Math.floor(v)) * Math.PI * 2, cycles: v - Math.floor(v) < 0.5 ? 3 : 4 };
    });
    function draw(ms = 0) {
      ctx.clearRect(0, 0, 937, 232);
      for (const d of dots) {
        const wave = media.matches ? 0.55 : 0.1 + 0.8 * Math.pow(0.5 + 0.5 * Math.sin(ms / 16e3 * Math.PI * 2 * d.cycles + d.phase), 2);
        ctx.beginPath();
        ctx.fillStyle = `rgba(165,182,209,${wave})`;
        ctx.arc(d.x + d.r, d.y + d.r, d.r, 0, Math.PI * 2);
        ctx.fill();
      }
      if (!media.matches && !document.hidden) frame = requestAnimationFrame(draw);
    }
    const restart = () => {
      cancelAnimationFrame(frame);
      draw(performance.now());
    };
    restart();
    media.addEventListener("change", restart);
    document.addEventListener("visibilitychange", restart);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      media.removeEventListener("change", restart);
      document.removeEventListener("visibilitychange", restart);
    };
  }, []);
  return <div className={"figmaAmbient " + (welcome ? "welcomeAmbient" : "")} aria-hidden="true"><div ref={coordinates} className="ambientCoordinates"><img className="ambientLight lightRed" src={redLight} alt="" /><img className="ambientLight lightViolet" src={violetLight} alt="" /><div className="ambientVeil" /><canvas ref={canvas} width="937" height="232" className="ambientDots" /></div></div>;
}
export function HomeHeading({ count, name, reduced }) {
  const [now,setNow]=useState(()=>new Date());
  const target=countPhrase(count), mood=moodForCount(count);
  const [shown,setShown]=useState(()=>reduced?target:count>1?' things to do':''),[position,setPosition]=useState(0),[caret,setCaret]=useState(!reduced),[mode,setMode]=useState('text'),[pulse,setPulse]=useState(0);
  const [face,setFace]=useState(mood),[faceVisible,setFaceVisible]=useState(!!reduced),[revealing,setRevealing]=useState(false);
  const current=useRef(shown),previousCount=useRef(count),first=useRef(true),currentFace=useRef(reduced?mood:null);
  const textRef=useRef(null),measure=useRef(null),faceRef=useRef(null),[metrics,setMetrics]=useState({text:0,prefix:0,face:0,gap:0});
  useEffect(()=>{const refresh=()=>setNow(new Date()),t=setInterval(refresh,30000);window.addEventListener('focus',refresh);document.addEventListener('visibilitychange',refresh);return()=>{clearInterval(t);window.removeEventListener('focus',refresh);document.removeEventListener('visibilitychange',refresh)}},[]);
  useLayoutEffect(()=>{
    let live=true;
    const update=()=>{if(!live||!textRef.current)return;const next={text:textRef.current.getBoundingClientRect().width,prefix:measure.current.getBoundingClientRect().width,face:faceRef.current.getBoundingClientRect().width,gap:parseFloat(getComputedStyle(faceRef.current).marginLeft)||0};setMetrics(old=>Object.keys(next).every(k=>old[k]===next[k])?old:next)};
    update();const ro=new ResizeObserver(update);ro.observe(textRef.current);ro.observe(faceRef.current);document.fonts.ready.then(update);window.addEventListener('resize',update);
    return()=>{live=false;ro.disconnect();window.removeEventListener('resize',update)};
  },[shown,position]);
  useEffect(()=>{
    let cancelled=false,timer,resolveWait;
    const wait=ms=>new Promise(resolve=>{resolveWait=resolve;timer=setTimeout(resolve,ms)});
    const write=(value,pos)=>{if(cancelled)return;current.current=value;setShown(value);setPosition(pos)};
    async function play(){
      const oldCount=previousCount.current;previousCount.current=count;
      if(reduced){write(target,target.length);setCaret(false);setFace(mood);setFaceVisible(true);setRevealing(false);currentFace.current=mood;first.current=false;return}
      setCaret(true);setMode('text');setPulse(v=>v+1);
      const changeFace=first.current||currentFace.current!==mood;
      if(changeFace){setFaceVisible(false);setRevealing(false)}else{setFaceVisible(true)}
      if(first.current){
        first.current=false;
        if(count>1){write(' things to do',0);await wait(450);const digits=String(count);for(let i=1;i<=digits.length&&!cancelled;i++){write(digits.slice(0,i)+' things to do',i);await wait(90)}}
        else{write('',0);await wait(300);for(let i=1;i<=target.length&&!cancelled;i++){write(target.slice(0,i),i);await wait(42)}}
      }else if(oldCount>1&&count>1&&/^(\d*) things to do$/.test(current.current)){
        const old=current.current.split(' ')[0];for(let i=old.length;i>=0&&!cancelled;i--){write(old.slice(0,i)+' things to do',i);await wait(65)}
        const digits=String(count);for(let i=1;i<=digits.length&&!cancelled;i++){write(digits.slice(0,i)+' things to do',i);await wait(90)}
      }else{
        const old=current.current;for(let i=old.length;i>=0&&!cancelled;i--){write(old.slice(0,i),i);await wait(19)}await wait(120);
        for(let i=1;i<=target.length&&!cancelled;i++){write(target.slice(0,i),i);await wait(42)}
      }
      if(cancelled)return;
      if(changeFace){
        setPosition(target.length);setMode('mood-start');setFace(mood);setFaceVisible(true);setRevealing(true);currentFace.current=mood;
        await wait(32);if(cancelled)return;setMode('mood-end');await wait(260);if(cancelled)return;setRevealing(false);
      }
      setPulse(v=>v+1);await wait(1560);if(!cancelled)setCaret(false);
    }
    play();return()=>{cancelled=true;clearTimeout(timer);resolveWait?.()};
  },[target,mood,reduced]);
  const left=mode==='text'?metrics.prefix+2:metrics.text+metrics.gap+(mode==='mood-end'?metrics.face:0);
  return <div className="figmaHeading"><p className="personalGreeting">{greetingFor(name,now)}</p><h1 className="taskStatement" aria-label={target}><span ref={textRef} className="headingText" aria-hidden="true">{shown||'\u00a0'}</span><span ref={measure} className="caretMeasure" aria-hidden="true">{shown.slice(0,position)}</span><span ref={faceRef} data-mood={face} className={'headingMood '+(faceVisible?'isVisible ':'')+(revealing?'isRevealing':'')} aria-hidden="true"><img src={moodAssets[face]} alt=""/></span>{caret&&!reduced&&<i key={pulse} aria-hidden="true" data-position={mode} className="typingCaret isTyping" style={{left}}/>}</h1><span className="srOnly" role="status" aria-live="polite">{target}</span></div>;
}
export function NameWelcome({initialName='',onContinue,busy,error}){
 const [name,setName]=useState(initialName);
 return <><h2 id="welcome-title">怎么称呼你？</h2><p>让每次打开，都有一句属于你的问候。</p><form className="nameWelcomeForm" onSubmit={e=>{e.preventDefault();onContinue(name)}}><label htmlFor="welcome-name">你的称呼</label><input autoFocus id="welcome-name" value={name} onChange={e=>setName(e.target.value)} maxLength={32} placeholder="比如 Shaw" autoComplete="nickname"/>{error&&<p className="fieldError" role="alert">{error}</p>}<div className="welcomeActions"><button type="button" disabled={busy} onClick={()=>onContinue('')}>暂时跳过</button><button className="primary" type="submit" disabled={busy||!name.trim()}>{busy?'保存中…':'继续'}</button></div></form></>;
}
export function CompletionPaper() {
  return <div className="completionPaper" aria-hidden="true"><svg viewBox="0 0 80 80"><path d="M18 15Q40 23 63 12L58 65Q36 73 14 61Z" fill="white" /><path d="m27 42 9 9 19-22" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" /></svg></div>;
}
