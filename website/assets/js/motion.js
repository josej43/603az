window.Motion=(()=>{
 let observer;
 function init(){
  if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches){
   const glow=document.getElementById('cursorGlow');
   window.addEventListener('pointermove',e=>{if(glow)glow.style.transform=`translate(${e.clientX-260}px,${e.clientY-260}px)`},{passive:true});
  }
  const intro=document.getElementById('intro');
  const dismiss=()=>{intro?.classList.add('done');try{sessionStorage.setItem('civicpulse.introSeen','yes')}catch(_){}};
  document.getElementById('skipIntro')?.addEventListener('click',dismiss);
  if(sessionStorage.getItem('civicpulse.introSeen')==='yes'||window.matchMedia('(prefers-reduced-motion: reduce)').matches)dismiss();
  else setTimeout(dismiss,2450);
 }
 function reveal(){
  observer?.disconnect();
  if(!('IntersectionObserver' in window)){document.querySelectorAll('.reveal').forEach(el=>el.classList.add('visible'));return;}
  observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');observer.unobserve(e.target)}}),{threshold:.1});
  document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));
  if(window.matchMedia('(hover:hover) and (prefers-reduced-motion:no-preference)').matches){
   document.querySelectorAll('[data-tilt]').forEach(card=>{
    card.addEventListener('pointermove',e=>{const r=card.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;card.style.transform=`perspective(700px) rotateY(${x*5}deg) rotateX(${-y*5}deg)`});
    card.addEventListener('pointerleave',()=>{card.style.transform=''});
   });
  }
 }
 return {init,reveal};
})();
