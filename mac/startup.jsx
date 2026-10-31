import React,{useEffect,useRef,useState} from 'react';
export default function StartupGate({children}){
 const [phase,setPhase]=useState('waiting'),timer=useRef();
 useEffect(()=>{const ready=()=>{setPhase('opening');timer.current=setTimeout(()=>setPhase('done'),matchMedia('(prefers-reduced-motion: reduce)').matches?0:720)};window.addEventListener('tuck-ready',ready,{once:true});return()=>{window.removeEventListener('tuck-ready',ready);clearTimeout(timer.current)}},[]);
 return <><div className={'applicationReveal '+phase}>{children}</div>{phase!=='done'&&<div className={'launchSurface '+phase} aria-label="正在打开 Tuck" role="status"><span className="launchSeed"/></div>}</>;
}
