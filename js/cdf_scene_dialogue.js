/* Gesture presentation only: no account submit, consent, permissions or storage writes. */
(function(root){'use strict';
 function swipe({dx,dy,elapsed=0,interactive=false,pointers=1}={}){if(interactive||pointers!==1||!Number.isFinite(dx)||!Number.isFinite(dy)||elapsed>800||Math.abs(dx)<64||Math.abs(dx)<Math.abs(dy)*1.6)return null;return dx<0?'next':'back';}
 function gesture(){let first=null,invalid=false;const active=new Set();return{
 down(e,interactive=false){if(!['touch','pen','mouse'].includes(e.pointerType)||(e.pointerType==='mouse'&&e.button!==0))return;active.add(e.pointerId);if(active.size!==1||e.isPrimary===false){invalid=true;return;}first={x:e.clientX,y:e.clientY,time:e.timeStamp,id:e.pointerId,interactive};invalid=false;},
 up(e){const p=first,blocked=invalid;active.delete(e.pointerId);if(!active.size){first=null;invalid=false;}if(!p||p.id!==e.pointerId||blocked)return null;return swipe({dx:e.clientX-p.x,dy:e.clientY-p.y,elapsed:e.timeStamp-p.time,interactive:p.interactive});},
 cancel(){first=null;invalid=false;active.clear();}
 };}const api={swipe,gesture};if(typeof module==='object'&&module.exports)module.exports=api;
 const doc=root.document,main=doc?.querySelector('.journey-shell');if(!main)return;
 const $=id=>doc.getElementById(id),panel=doc.querySelector('.account-panel'),scene=doc.querySelector('.world-window'),heading=scene.querySelector('h1'),originalHeading=heading.textContent;
 const words={de:{options:'Weitere Wege & Hinweise',peek:'Szene ansehen',reply:'Zurück zu den Antworten',swipe:'← Auf der Szene wischen oder ziehen →',login:'Vorhandenes Konto'},en:{options:'More paths & information',peek:'Enjoy the scene',reply:'Back to answers',swipe:'← Swipe or drag on the scene →',login:'Existing account'},pt:{options:'Mais caminhos e informações',peek:'Ver a cena',reply:'Voltar às respostas',swipe:'← Desliza ou arrasta na cena →',login:'Conta existente'}};
 function put(el,value){if(el.textContent!==value)el.textContent=value;}
 const text=()=>words[doc.documentElement.lang]||words.en,options=doc.createElement('details'),summary=doc.createElement('summary');options.className='journey-options';options.append(summary);
 const quick=doc.createElement('button');quick.type='button';quick.className='quick-login';quick.addEventListener('click',()=>{options.open=false;$('mode-login').click();});options.append(quick);
 for(const el of [doc.querySelector('.identity-details'),panel.querySelector('footer'),doc.querySelector('.luvo-cultural-note')])if(el)options.append(el);panel.append(options);
 const controls=doc.createElement('div');controls.className='scene-controls';const tip=doc.createElement('span');tip.className='scene-swipe-tip';const peek=doc.createElement('button');peek.type='button';peek.className='scene-peek';peek.setAttribute('aria-expanded','false');controls.append(tip,peek);scene.append(controls);
 doc.body.classList.add('cdf-dialogue');
 let speechKey='',viewKey='';
 function frame(){const height=root.visualViewport?.height||root.innerHeight;if(height)doc.body.style.setProperty('--cdf-viewport-height',Math.round(height)+'px');
 const editable=doc.activeElement?.matches?.('input,textarea,select');doc.body.dataset.keyboardOpen=String(!!editable&&height<560);
 const r=scene.getBoundingClientRect();const host=$('luvo-scene');if(!host)return;for(const [k,v]of Object.entries({top:r.top,left:r.left,width:r.width,height:r.height}))host.style.setProperty('--cdf-scene-'+k,v+'px');root.dispatchEvent(new root.Event('cdf:scene-frame'));}
 function sync(){const story=$('story-section'),register=$('register-section'),login=$('login-section'),outcome=$('identity-outcome');const mode=!outcome.hidden?'outcome':!story.hidden?'story':!register.hidden?'register':!login.hidden?'login':'welcome';doc.body.dataset.dialogMode=mode;
  const title=mode==='story'?$('story-title').textContent:mode==='register'?register.querySelector('[data-journey-step]:not([hidden]) h2')?.textContent:originalHeading;if(heading.textContent!==title)heading.textContent=title||originalHeading;
  const question=$('flowee-question'),more=$('flowee-more'),moreLabel=$('flowee-more-label'),answers=$('register-answers'),status=$('auth-status'),entry=$('identity-entry');
  const compact=root.innerWidth<=700||root.innerHeight<=500;
  if(question){const hideQuestion=!(compact&&mode==='register');if(question.hidden!==hideQuestion)question.hidden=hideQuestion;put(question,title||originalHeading);}
  if(moreLabel)put(moreLabel,({de:'Mehr von Flowee',en:'More from Flowee',pt:'Mais da Flowee'})[doc.documentElement.lang]||'More from Flowee');
  const nextSpeechKey=String(compact)+':'+mode+':'+(title||'');
  if(more&&speechKey!==nextSpeechKey){more.open=!(compact&&mode==='register');speechKey=nextSpeechKey;}
  if(answers&&status){if(mode==='register'&&status.parentNode!==answers)answers.prepend(status);else if(mode!=='register'&&status.parentNode!==panel)panel.insertBefore(status,entry);}
  const nextViewKey=mode+':'+(title||'');if(viewKey!==nextViewKey){if(answers)answers.scrollTop=0;viewKey=nextViewKey;}

  put(summary,text().options);put(quick,text().login);put(tip,mode==='register'?({de:'Weiter mit dem sichtbaren Button',en:'Use the visible Continue button',pt:'Usa o botão Continuar'})[doc.documentElement.lang]||'Use Continue':text().swipe);put(peek,doc.body.dataset.sceneExpanded==='true'?text().reply:text().peek);
 }
 peek.addEventListener('click',()=>{const open=doc.body.dataset.sceneExpanded!=='true';doc.body.dataset.sceneExpanded=String(open);peek.setAttribute('aria-expanded',String(open));sync();frame();});
 function navigate(direction){if(doc.body.dataset.accountConnecting==='true')return;
  if(!$('welcome-section').hidden){if(direction==='next')$('start-journey').click();return;}
  if(!$('story-section').hidden){if(direction==='back')$('story-back').click();else if(!['return_path','threshold'].includes($('story-section').dataset.introBeat))$('story-next').click();}
 }
 const gestures=gesture();main.addEventListener('pointerdown',e=>{const interactive=!!e.target.closest('input,textarea,select,button,a,summary,[contenteditable=true]')||e.clientX<24||e.clientX>root.innerWidth-24;gestures.down(e,interactive);if(!interactive&&['touch','pen','mouse'].includes(e.pointerType)&&(e.pointerType!=='mouse'||e.button===0)){if(e.pointerType==='mouse')e.preventDefault();try{main.setPointerCapture?.(e.pointerId);}catch{}}});
 main.addEventListener('pointercancel',()=>gestures.cancel());main.addEventListener('lostpointercapture',()=>gestures.cancel());main.addEventListener('pointerup',e=>{const direction=gestures.up(e);if(direction)navigate(direction);});
 const observer=new root.MutationObserver(sync);observer.observe(main,{subtree:true,attributes:true,attributeFilter:['hidden'],childList:true});const lang=new root.MutationObserver(sync);lang.observe(doc.documentElement,{attributes:true,attributeFilter:['lang']});
 const resize=root.ResizeObserver?new root.ResizeObserver(frame):null;resize?.observe(scene);root.addEventListener('resize',()=>{sync();frame();});root.visualViewport?.addEventListener('resize',frame);doc.addEventListener('focusin',frame);doc.addEventListener('focusout',frame);root.addEventListener('pagehide',()=>{observer.disconnect();lang.disconnect();resize?.disconnect();root.visualViewport?.removeEventListener('resize',frame);doc.removeEventListener('focusin',frame);doc.removeEventListener('focusout',frame);});
 sync();frame();root.CDFSceneDialogue=Object.freeze({...api,navigate});
})(typeof window==='object'?window:globalThis);
