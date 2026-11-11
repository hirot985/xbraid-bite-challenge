/** Suppress only a rapid one-finger double tap in the active play area.
 * Pointerdown still scores each tap. Never cancel multi-touch/pinch gestures. */
export function installTapZoomGuard(element,{isActive,now=()=>performance.now()}={}){
 let previous=null,multiTouch=false;
 const reset=()=>{previous=null;multiTouch=false;};
 const start=event=>{if(event.touches.length>1){multiTouch=true;previous=null;}};
 const end=event=>{
  if(multiTouch){if(event.touches.length===0)reset();return;}
  if(!isActive()||event.touches.length||event.changedTouches.length!==1){previous=null;return;}
  const touch=event.changedTouches[0],current={time:now(),x:touch.clientX,y:touch.clientY};
  if(previous&&current.time-previous.time>=0&&current.time-previous.time<340&&Math.hypot(current.x-previous.x,current.y-previous.y)<32&&event.cancelable)event.preventDefault();
  previous=current;
 };
 const doubleClick=event=>{if(isActive()&&event.cancelable)event.preventDefault();};
 element.addEventListener('touchstart',start,{passive:true});
 element.addEventListener('touchend',end,{passive:false});
 element.addEventListener('touchcancel',reset,{passive:true});
 element.addEventListener('dblclick',doubleClick);
 return {reset,destroy(){element.removeEventListener('touchstart',start);element.removeEventListener('touchend',end);element.removeEventListener('touchcancel',reset);element.removeEventListener('dblclick',doubleClick);}};
}
