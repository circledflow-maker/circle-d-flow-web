/* Optional visual layer. Never delays navigation, validates identity or awards progress. */
(function(root){'use strict';
 const preference=root.matchMedia?.('(prefers-reduced-motion: reduce)');
 const running=new Map();
 function cancel(node){const animation=running.get(node);if(animation){animation.cancel();running.delete(node);}}
 function allowed(){return !preference?.matches&&!document.hidden;}
 function play(node,frames,options){
  if(!node)return;cancel(node);if(!allowed()||typeof node.animate!=='function')return;
  try{const animation=node.animate(frames,{duration:360,easing:'cubic-bezier(.2,.75,.25,1)',...options});running.set(node,animation);
   const clear=()=>{if(running.get(node)===animation)running.delete(node);};animation.onfinish=clear;animation.oncancel=clear;
  }catch{/* Unsupported effects leave the static, fully interactive UI intact. */}
 }
 function fairy(kind='step'){
  const node=document.getElementById('cdf-account-flowee');
  play(node,[{transform:'translate(0,0) rotate(0deg)'},{transform:kind==='ready'?'translate(8px,-14px) rotate(9deg)':'translate(5px,-7px) rotate(5deg)',offset:.45},{transform:'translate(0,0) rotate(0deg)'}],{duration:kind==='ready'?900:520});
 }
 function enter(node,kind='step',direction=1){
  if(document.body)document.body.dataset.journeyScene=kind;
  play(node,[{opacity:.2,transform:`translateY(${kind==='ready'?16:8}px) translateX(${direction<0?-6:6}px)`},{opacity:1,transform:'translate(0,0)'}],{duration:kind==='ready'?650:300});
  const dialogue=document.getElementById('flowee-dialogue');play(dialogue,[{opacity:.35},{opacity:1}],{duration:260});
  if(kind==='ready'){
   play(node?.querySelector('.pass-card'),[{opacity:0,transform:'perspective(800px) rotateY(-12deg) scale(.96)'},{opacity:1,transform:'perspective(800px) rotateY(0deg) scale(1)'}],{duration:850});
   play(node?.querySelector('.pass-seal'),[{opacity:0,transform:'rotate(-35deg) scale(.7)'},{opacity:1,transform:'rotate(0deg) scale(1)'}],{duration:950});
  }
  fairy(kind);
 }
 function stop(){for(const node of [...running.keys()])cancel(node);}
 function visibility(){if(document.body)document.body.dataset.motionPaused=String(document.hidden);if(!allowed())stop();}
 preference?.addEventListener?.('change',visibility);document.addEventListener('visibilitychange',visibility);
 document.addEventListener('focusin',event=>{if(event.target?.matches?.('#identity-entry input'))fairy('focus');});
 root.addEventListener('pagehide',stop);
 root.CDFAccountMotion={enter,fairy};
})(window);
