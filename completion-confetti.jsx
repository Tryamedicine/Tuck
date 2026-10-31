import React,{useEffect,useRef} from 'react';

const colors=['#94a5ff','#b6a0ff','#e09be9','#f19abd','#f5aa90','#d2f78a'];

// One canvas clipped to the application panel, never to the simulated desktop.
export default function CompletionConfetti({event,onFinish}){
  const canvas=useRef(null),finish=useRef(onFinish);finish.current=onFinish;
  useEffect(()=>{
    const el=canvas.current,ctx=el?.getContext('2d');
    if(!ctx){finish.current();return;}
    let frame=0,width=0,height=0,last=0,elapsed=0;
    const duration=event.allDone?3.2:2.7;
    function size(){const bounds=el.getBoundingClientRect();width=Math.max(1,bounds.width);height=Math.max(1,bounds.height);const ratio=Math.min(window.devicePixelRatio||1,2);el.width=Math.round(width*ratio);el.height=Math.round(height*ratio);ctx.setTransform(ratio,0,0,ratio,0,0);}
    size();const observer=new ResizeObserver(size);observer.observe(el);
    const pieces=Array.from({length:event.allDone?100:64},(_,i)=>({
      x:Math.random(),y:-Math.random()*height*.32-12,vx:(Math.random()-.5)*95,
      vy:height*(.28+Math.random()*.23),angle:Math.random()*Math.PI*2,
      spin:(Math.random()-.5)*9,phase:Math.random()*Math.PI*2,
      w:4+Math.random()*4,h:i%4===0?18+Math.random()*12:7+Math.random()*7,color:colors[i%colors.length]
    }));
    function draw(now){
      const dt=last?Math.min((now-last)/1000,.04):0;last=now;elapsed+=dt;
      ctx.clearRect(0,0,width,height);
      for(const p of pieces){
        p.y+=p.vy*dt;p.vy+=height*.13*dt;p.x+=p.vx*dt/width;p.angle+=p.spin*dt;
        ctx.save();ctx.globalAlpha=Math.min(1,(duration-elapsed)/.65);
        ctx.translate(p.x*width+Math.sin(elapsed*4+p.phase)*18,p.y);ctx.rotate(p.angle);
        ctx.scale(.4+Math.abs(Math.cos(elapsed*6+p.phase))*.6,1);
        ctx.fillStyle=p.color;ctx.fillRect(-p.w/2,-p.h/2,p.w,p.h);ctx.restore();
      }
      if(elapsed<duration)frame=requestAnimationFrame(draw);else finish.current();
    }
    frame=requestAnimationFrame(draw);
    return()=>{cancelAnimationFrame(frame);observer.disconnect();ctx.clearRect(0,0,width,height);};
  },[event]);
  return <canvas ref={canvas} className="completionConfetti" aria-hidden="true"/>;
}
