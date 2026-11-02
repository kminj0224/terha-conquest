'use strict';
// Same cadence as the prologue. Reserve full text geometry before revealing it.
const DialogueTypewriter = Object.freeze({
 start(element, next, text) {
  const characters=Array.from(text), measure=document.createElement('span'), visible=document.createElement('span');
  measure.className='vnMeasure';measure.setAttribute('aria-hidden','true');measure.textContent=text;
  visible.className='vnVisible';visible.setAttribute('aria-hidden','true');
  element.textContent='';element.setAttribute('aria-label',text);element.appendChild(measure);element.appendChild(visible);
  next.hidden=true;next.disabled=true;
  let frame=0,elapsed=0,last=performance.now(),ready=false,cancelled=false;
  const reset=()=>{last=performance.now()};
  document.addEventListener('visibilitychange',reset);
  const cancel=()=>{cancelled=true;cancelAnimationFrame(frame);document.removeEventListener('visibilitychange',reset)};
  const animate=now=>{
   if(cancelled||element.isConnected===false){cancel();return;}
   if(!document.hidden)elapsed+=Math.max(0,now-last);
   last=now;const count=Math.min(characters.length,Math.floor(elapsed/42));
   visible.textContent=characters.slice(0,count).join('');
   if(count===characters.length){ready=true;next.hidden=false;next.disabled=false;document.removeEventListener('visibilitychange',reset);return;}
   frame=requestAnimationFrame(animate);
  };
  frame=requestAnimationFrame(animate);
  return {cancel,get ready(){return ready}};
 }
});
// Game chrome never opens the system copy/share selection menu. Editable fields retain editing.
for(const type of ['selectstart','contextmenu','dragstart'])document.addEventListener(type,event=>{
 if(!event.target?.closest?.('input,textarea,[contenteditable="true"]'))event.preventDefault();
});
