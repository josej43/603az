/* CivicPulse cinematic city renderer. No external libraries or network calls. */
(()=>{'use strict';
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const scenePoints=Array.from({length:48},(_,i)=>({x:(Math.sin(i*67.31)*437.31%1+1)%1,y:(Math.cos(i*23.41)*531.71%1+1)%1,z:Math.abs(Math.sin(i*13.42))}));
 let raf=0,canvas=null,ctx=null,scene=null,ro=null,active=false,w=0,h=0,dpr=1,mouse={x:0,y:0},phase=0;
 const buildings=[];
 for(let i=0;i<35;i++){const col=i%7,row=Math.floor(i/7);const height=.28+Math.abs(Math.sin(i*9.17+1))*.96; buildings.push({x:col-3.1,z:row-2.2,height,seed:i})}
 function iso(x,z,y=0){const scale=Math.min(w/12,h/7.8);const sway=Math.sin(phase*.25)*.09;const x2=x*Math.cos(sway)-z*Math.sin(sway),z2=x*Math.sin(sway)+z*Math.cos(sway);return {x:w*.51+(x2-z2)*scale*.82+mouse.x*10,y:h*.58+(x2+z2)*scale*.37-y*scale+mouse.y*8}}
 function polygon(points,color,stroke){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fillStyle=color;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=.85;ctx.stroke()}}
 function render(){if(!ctx||!active)return;ctx.clearRect(0,0,w,h);const t=phase;
 const bg=ctx.createRadialGradient(w*.51,h*.55,10,w*.5,h*.5,w*.6);bg.addColorStop(0,'rgba(29,138,177,.23)');bg.addColorStop(1,'rgba(1,9,25,0)');ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
 ctx.strokeStyle='rgba(109,196,246,.11)';ctx.lineWidth=1;
 for(let v=-6;v<=6;v++){let a=iso(v,-5,0),b=iso(v,5,0);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();a=iso(-5,v,0);b=iso(5,v,0);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke()}
 const rings=[1,2,3]; rings.forEach((k)=>{ctx.beginPath();const r=(t*13+k*80)%(Math.min(w,h)*.85);ctx.ellipse(w*.52,h*.64,r,r*.4,0,0,Math.PI*2);ctx.strokeStyle=`rgba(113,231,253,${Math.max(0,.19-r/(w*.9))})`;ctx.stroke()});
 const scale=Math.min(w/12,h/7.8);
 buildings.slice().sort((a,b)=>(a.x+a.z)-(b.x+b.z)).forEach(b=>{const x=b.x*1.1,z=b.z*.95,hh=b.height*(1+Math.sin(t*.7+b.seed)*.017);let a=iso(x-.38,z-.36),bb=iso(x+.38,z-.36),c=iso(x+.38,z+.36),d=iso(x-.38,z+.36);let A=iso(x-.38,z-.36,hh),B=iso(x+.38,z-.36,hh),C=iso(x+.38,z+.36,hh),D=iso(x-.38,z+.36,hh);const hue=b.seed%5===0?'111,249,188':'84,196,249';polygon([bb,c,C,B],`rgba(14,76,107,.91)`,`rgba(${hue},.15)`);polygon([d,c,C,D],`rgba(11,47,81,.92)`,`rgba(${hue},.18)`);polygon([a,bb,B,A],`rgba(25,81,108,.94)`,`rgba(${hue},.2)`);polygon([A,B,C,D],`rgba(${hue},.23)`,`rgba(${hue},.55)`);
  for(let floor=.22;floor<hh-.08;floor+=.26){const p=iso(x+.39,z-.18,floor),q=iso(x+.39,z+.14,floor);ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.strokeStyle=`rgba(${hue},${.17+.15*Math.sin(t*1.1+b.seed+floor)**2})`;ctx.stroke()}
  if(b.seed%6===0){const top=iso(x,z,hh);ctx.beginPath();ctx.arc(top.x,top.y,2.5+Math.sin(t*2+b.seed),0,Math.PI*2);ctx.fillStyle='#b7ffc3';ctx.shadowColor='#7eeec2';ctx.shadowBlur=14;ctx.fill();ctx.shadowBlur=0}
 });
 scenePoints.forEach((p,i)=>{const px=p.x*w,py=p.y*h;ctx.fillStyle=`rgba(163,239,254,${.1+.3*Math.abs(Math.sin(t*.45+i))})`;ctx.beginPath();ctx.arc(px,py,Math.max(.5,p.z*1.2),0,Math.PI*2);ctx.fill()});
 ctx.fillStyle='rgba(127,224,244,.64)';ctx.font='10px monospace';ctx.fillText('CITY NETWORK / ACTIVE',w*.08,h*.83);
 phase+=reduced?0:.012;if(!reduced)raf=requestAnimationFrame(render)
 }
 function resize(){if(!canvas||!scene)return;const r=scene.getBoundingClientRect();w=Math.max(1,r.width);h=Math.max(1,r.height);dpr=Math.min(window.devicePixelRatio||1,2);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);render()}
 function setup(){const found=document.querySelector('#civicCity');if(found===canvas)return;stop();canvas=found;scene=canvas?.closest('.city-scene');if(!canvas||!scene)return;ctx=canvas.getContext('2d',{alpha:true});if(!ctx)return;active=true;ro=new ResizeObserver(resize);ro.observe(scene);resize();scene.addEventListener('pointermove',onMove,{passive:true});scene.addEventListener('pointerleave',onLeave);if(!reduced&&!raf)raf=requestAnimationFrame(render)}
 function onMove(e){if(reduced||!scene)return;const r=scene.getBoundingClientRect();mouse.x=((e.clientX-r.left)/r.width-.5)*2;mouse.y=((e.clientY-r.top)/r.height-.5)*2;scene.style.transform=`perspective(1200px) rotateY(${mouse.x*6}deg) rotateX(${-mouse.y*5}deg) translateY(-3px)`}
 function onLeave(){mouse.x=0;mouse.y=0;if(scene)scene.style.transform=''}
 function stop(){active=false;cancelAnimationFrame(raf);raf=0;ro?.disconnect();ro=null;if(scene){scene.removeEventListener('pointermove',onMove);scene.removeEventListener('pointerleave',onLeave)}canvas=null;scene=null;ctx=null}
 document.addEventListener('DOMContentLoaded',()=>{const target=document.getElementById('view');if(target){new MutationObserver(()=>setup()).observe(target,{childList:true})}setup();document.addEventListener('pointerdown',e=>{if(reduced)return;const button=e.target.closest('button,.btn,.icon-btn,.feature-card');if(!button)return;const r=button.getBoundingClientRect();const ring=document.createElement('span');ring.className='press-ripple';ring.style.left=(e.clientX-r.left)+'px';ring.style.top=(e.clientY-r.top)+'px';if(getComputedStyle(button).position==='static')button.style.position='relative';button.style.overflow='hidden';button.appendChild(ring);setTimeout(()=>ring.remove(),700)});document.addEventListener('pointermove',e=>{const card=e.target.closest('.feature-card');if(!card)return;const r=card.getBoundingClientRect();card.style.setProperty('--pointer-x',((e.clientX-r.left)/r.width*100)+'%');card.style.setProperty('--pointer-y',((e.clientY-r.top)/r.height*100)+'%')},{passive:true})});
})();
