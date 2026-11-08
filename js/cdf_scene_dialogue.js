/* Gesture presentation only: no account submit, consent, permissions or storage writes. */
(function(root){'use strict';
 function swipe({dx,dy,elapsed=0,interactive=false,pointers=1}={}){if(interactive||pointers!==1||!Number.isFinite(dx)||!Number.isFinite(dy)||elapsed>800||Math.abs(dx)<64||Math.abs(dx)<Math.abs(dy)*1.6)return null;return dx<0?'next':'back';}
 function gesture(){let first=null,invalid=false;const active=new Set();return{
 down(e,interactive=false){if(!['touch','pen','mouse'].includes(e.pointerType)||(e.pointerType==='mouse'&&e.button!==0))return;active.add(e.pointerId);if(active.size!==1||e.isPrimary===false){invalid=true;return;}first={x:e.clientX,y:e.clientY,time:e.timeStamp,id:e.pointerId,interactive};invalid=false;},
 up(e){const p=first,blocked=invalid;active.delete(e.pointerId);if(!active.size){first=null;invalid=false;}if(!p||p.id!==e.pointerId||blocked)return null;return swipe({dx:e.clientX-p.x,dy:e.clientY-p.y,elapsed:e.timeStamp-p.time,interactive:p.interactive});},
 cancel(){first=null;invalid=false;active.clear();}
 };}function viewportFrame(width,height){return{left:0,top:0,width:Math.max(1,Number(width)||1),height:Math.max(1,Number(height)||1)};}
 function bubblePosition({x,y,width,height,top=12,bottom=height,bubbleWidth=230,bubbleHeight=90}){
  const radius=52,leftSpace=x-radius-12,rightSpace=width-x-radius-12,side=leftSpace>=rightSpace?'right':'left';
  const w=Math.max(80,Math.min(bubbleWidth,width-24,Math.max(leftSpace,rightSpace)));
  const left=side==='right'?x-radius-w:x+radius;
  return{left:Math.max(12,Math.min(width-w-12,left)),top:Math.max(top,Math.min(Math.max(top,bottom-bubbleHeight-12),y-28)),width:w,tail:side};
 }
 function fairyTarget({width,height,top=110,bottom=height,mode='welcome',beat='',step=0}={}){
  const sequence=['city_light','flowee_lantern','many_worlds','first_step','return_path','threshold'],index=sequence.indexOf(beat);
  const right=mode==='welcome'||mode==='login'||(mode==='register'?step%2===0:index<0||index%2===1);
  const minY=Math.min(height-48,top+46),maxY=Math.max(minY,Math.min(height-48,bottom-46));
  return{x:width*(right?.84:.16),y:Math.min(maxY,minY+Math.max(0,maxY-minY)*.18),width,height};
 }
 function speechPages(value,limit=105){const words=String(value||'').trim().split(/\s+/).filter(Boolean),pages=[];let page='';for(const word of words){if(page&&page.length+word.length+1>limit){pages.push(page);page='';}page+=(page?' ':'')+word;}if(page)pages.push(page);return pages.length?pages:[''];}
 function interactionMode({mode,beat}={}){return ['register','login','outcome'].includes(mode)||(mode==='story'&&['many_worlds','first_step','return_path','threshold'].includes(beat));}
 const api={swipe,gesture,viewportFrame,bubblePosition,interactionMode,fairyTarget,speechPages};if(typeof module==='object'&&module.exports)module.exports=api;
 const doc=root.document,main=doc?.querySelector('.journey-shell');if(!main)return;
 const $=id=>doc.getElementById(id),panel=doc.querySelector('.account-panel'),scene=doc.querySelector('.world-window'),heading=scene.querySelector('h1'),originalHeading=heading.textContent,guide=doc.querySelector('.flowee-guide');if(guide){guide.id='cdf-flowee-speech';scene.append(guide);}
 const floweeTap=doc.createElement('button');floweeTap.type='button';floweeTap.className='flowee-hotspot';floweeTap.hidden=false;floweeTap.setAttribute('aria-controls','cdf-flowee-speech');floweeTap.setAttribute('aria-expanded','true');scene.append(floweeTap);const fallbackFairy=$('cdf-account-flowee');if(fallbackFairy)floweeTap.append(fallbackFairy);
 floweeTap.addEventListener('click',()=>{root.clearTimeout(speechTimer);if(guide){guide.hidden=!guide.hidden;floweeTap.setAttribute('aria-expanded',String(!guide.hidden));if(!guide.hidden)frame();}});
 const words={de:{options:'Weitere Wege & Hinweise',peek:'Antworten ausblenden',reply:'Antworten zeigen',swipe:'← Auf der Szene wischen oder ziehen →',login:'Vorhandenes Konto'},en:{options:'More paths & information',peek:'Hide answers',reply:'Show answers',swipe:'← Swipe or drag on the scene →',login:'Existing account'},pt:{options:'Mais caminhos e informações',peek:'Ocultar respostas',reply:'Mostrar respostas',swipe:'← Desliza ou arrasta na cena →',login:'Conta existente'}};
 const greeting={
 de:{title:'Willkommen.',body:'Willkommen in LUVO, zwischen den Welten von Circle D Flow. Ich bin Flowee und begleite dich. An der Hütte am Lichtpfad wählst du deinen ersten Schritt. Du kannst auch einfach als Gast entdecken.',start:'Mit Flowee beginnen',login:'Ich habe ein Konto',back:'Zurück'},
 en:{title:'Welcome.',body:'Welcome to LUVO, between the worlds of Circle D Flow. I’m Flowee, your guide. At the cottage on the light path, you can choose your first step or simply explore as a guest.',start:'Begin with Flowee',login:'I have an account',back:'Back'},
 pt:{title:'Bem-vindo.',body:'Bem-vindo a LUVO, entre os mundos do Circle D Flow. Sou a Flowee, a tua guia. Na cabana do caminho de luz, podes escolher o primeiro passo ou explorar como visitante.',start:'Começar com a Flowee',login:'Já tenho conta',back:'Voltar'}};
 const cinematic=doc.createElement('div');cinematic.className='flowee-cinematic';const cinematicCopy=doc.createElement('p'),cinematicActions=doc.createElement('div');cinematicActions.className='flowee-cinematic-actions';
 const cinematicNext=doc.createElement('button'),cinematicBack=doc.createElement('button');for(const button of [cinematicNext,cinematicBack])button.type='button';cinematicNext.className='primary';cinematic.append(cinematicCopy,cinematicActions);cinematicActions.append(cinematicNext,cinematicBack);guide?.querySelector('.flowee-speech').append(cinematic);
 let pageIndex=0,pageKey='';
 cinematicNext.addEventListener('click',()=>{const pages=speechPages(doc.body.dataset.dialogMode==='welcome'?(greeting[doc.documentElement.lang]||greeting.en).body:$('story-body').textContent);if(pageIndex<pages.length-1){pageIndex++;sync();frame();return;}if(doc.body.dataset.dialogMode==='welcome')$('start-journey').click();else $('story-next').click();});
 cinematicBack.addEventListener('click',()=>{if(pageIndex>0){pageIndex--;sync();frame();return;}if(doc.body.dataset.dialogMode==='welcome')$('mode-login').click();else $('story-back').click();});
 const dismiss=doc.createElement('button');dismiss.type='button';dismiss.className='flowee-dismiss';dismiss.textContent='×';guide?.querySelector('.flowee-speech').append(dismiss);dismiss.addEventListener('click',()=>{root.clearTimeout(speechTimer);guide.hidden=true;floweeTap.setAttribute('aria-expanded','false');});
 function put(el,value){if(el.textContent!==value)el.textContent=value;}
 const text=()=>words[doc.documentElement.lang]||words.en,options=doc.createElement('details'),summary=doc.createElement('summary');options.className='journey-options';options.append(summary);
 const quick=doc.createElement('button');quick.type='button';quick.className='quick-login';quick.addEventListener('click',()=>{options.open=false;$('mode-login').click();});options.append(quick);
 for(const el of [doc.querySelector('.identity-details'),panel.querySelector('footer'),doc.querySelector('.luvo-cultural-note')])if(el)options.append(el);panel.append(options);
 const controls=doc.createElement('div');controls.className='scene-controls';const tip=doc.createElement('span');tip.className='scene-swipe-tip';const peek=doc.createElement('button');peek.type='button';peek.className='scene-peek';peek.setAttribute('aria-expanded','true');peek.setAttribute('aria-controls','identity-entry');controls.append(tip,peek);panel.prepend(controls);
 doc.body.classList.add('cdf-dialogue');
 let speechKey='',viewKey='',frameKey='',lastAnchor=null,guideWidth=240,guideHeight=90,guideTop=100,guideBottom=root.innerHeight,speechTimer=0;
 function anchor(point){lastAnchor=point;floweeTap.style.left=Math.max(0,Math.min(point.width-76,point.x-38))+'px';floweeTap.style.top=Math.max(0,Math.min(point.height-76,point.y-38))+'px';if(!guide)return;const placed=bubblePosition({...point,top:guideTop,bottom:guideBottom,bubbleWidth:guideWidth,bubbleHeight:guideHeight});guide.style.width=placed.width+'px';guide.style.left=placed.left+'px';guide.style.top=placed.top+'px';guide.dataset.tail=placed.tail;}
 function target(width,height){return fairyTarget({width,height,top:guideTop,bottom:guideBottom,mode:doc.body.dataset.dialogMode,beat:$('story-section').dataset.introBeat,step:Array.from(doc.querySelectorAll('[data-journey-step]')).findIndex(n=>!n.hidden)});}
 function frame(){const height=root.visualViewport?.height||root.innerHeight,width=root.visualViewport?.width||root.innerWidth;
 const rect=viewportFrame(width,height);doc.body.style.setProperty('--cdf-viewport-height',rect.height+'px');
 doc.body.style.setProperty('--cdf-input-banner-height',Math.max(0,doc.querySelector('header')?.getBoundingClientRect().top||0)+'px');
 const editable=doc.activeElement?.matches?.('input,textarea,select');doc.body.dataset.keyboardOpen=String(!!editable&&height<560);
 const tools=doc.querySelector('.luvo-scene-tools')?.getBoundingClientRect();const headingTop=(tools?.bottom||80)+8;guideTop=headingTop+(heading.getBoundingClientRect().height||24)+8;
 const sheet=panel.getBoundingClientRect();guideBottom=sheet.top>guideTop?sheet.top:height;
 doc.body.style.setProperty('--cdf-intro-top',headingTop+'px');doc.body.style.setProperty('--cdf-guide-max-height',Math.max(60,guideBottom-guideTop-16)+'px');
 if(guide){const box=guide.getBoundingClientRect();guideWidth=box.width||240;guideHeight=box.height||90;}
 anchor(lastAnchor?{...lastAnchor,width:rect.width,height:rect.height}:target(width,height));
 const host=$('luvo-scene');if(!host)return;for(const [k,v]of Object.entries(rect))host.style.setProperty('--cdf-scene-'+k,v+'px');
 const nextKey=rect.width+'x'+rect.height;if(frameKey!==nextKey){frameKey=nextKey;root.dispatchEvent(new root.Event('cdf:scene-frame'));}
 }
 function sync(){const story=$('story-section'),register=$('register-section'),login=$('login-section'),outcome=$('identity-outcome');const mode=!outcome.hidden?'outcome':!story.hidden?'story':!register.hidden?'register':!login.hidden?'login':'welcome';doc.body.dataset.dialogMode=mode;
  floweeTap.setAttribute('aria-label',({de:'Flowees Sprechblase öffnen oder schließen',en:'Open or close Flowee’s speech bubble',pt:'Abrir ou fechar a fala da Flowee'})[doc.documentElement.lang]||'Open or close Flowee’s speech bubble');
  const hello=greeting[doc.documentElement.lang]||greeting.en,beat=story.dataset.introBeat,interactive=interactionMode({mode,beat});
  doc.body.dataset.luvoFocus=interactive?'cabin':'world';
  const nextInteraction=String(interactive);if(doc.body.dataset.dialogInteraction!==nextInteraction)doc.body.dataset.dialogInteraction=nextInteraction;
  if(cinematic.hidden===!interactive)cinematic.hidden=interactive;
  const nextPageKey=mode+':'+beat+':'+doc.documentElement.lang;if(pageKey!==nextPageKey){pageIndex=0;pageKey=nextPageKey;}
  const pages=speechPages(mode==='welcome'?hello.body:$('story-body').textContent);pageIndex=Math.min(pageIndex,pages.length-1);put(cinematicCopy,pages[pageIndex]);
  put(cinematicNext,pageIndex<pages.length-1?({de:'Weiter',en:'Continue',pt:'Continuar'})[doc.documentElement.lang]||'Continue':mode==='welcome'?hello.start:$('story-next').textContent);put(cinematicBack,pageIndex>0?hello.back:mode==='welcome'?hello.login:hello.back);
  dismiss.setAttribute('aria-label',({de:'Sprechblase schließen und Welt ansehen. Flowee öffnet sie wieder.',en:'Close speech and view the world. Select Flowee to reopen.',pt:'Fechar a fala e ver o mundo. Seleciona a Flowee para reabrir.'})[doc.documentElement.lang]||'Close speech');
  const title=mode==='welcome'?hello.title:mode==='story'?$('story-title').textContent:mode==='register'?register.querySelector('[data-journey-step]:not([hidden]) h2')?.textContent:originalHeading;if(heading.textContent!==title)heading.textContent=title||originalHeading;
  const question=$('flowee-question'),more=$('flowee-more'),moreLabel=$('flowee-more-label'),answers=$('register-answers'),status=$('auth-status'),entry=$('identity-entry');
  const compact=root.innerWidth<=700||root.innerHeight<=500;
  if(question){const hideQuestion=!(compact&&mode==='register');if(question.hidden!==hideQuestion)question.hidden=hideQuestion;put(question,title||originalHeading);}
  if(moreLabel)put(moreLabel,({de:'Mehr von Flowee',en:'More from Flowee',pt:'Mais da Flowee'})[doc.documentElement.lang]||'More from Flowee');
  const nextSpeechKey=String(compact)+':'+mode+':'+(title||'');
  if(more&&speechKey!==nextSpeechKey){more.open=!(compact&&mode==='register');speechKey=nextSpeechKey;}
  if(answers&&status){if(mode==='register'&&status.parentNode!==answers)answers.prepend(status);else if(mode!=='register'&&status.parentNode!==panel)panel.insertBefore(status,entry);}
  const nextViewKey=mode+':'+(title||'');if(viewKey!==nextViewKey){if(answers)answers.scrollTop=0;doc.body.dataset.sceneExpanded='false';peek.setAttribute('aria-expanded','true');if(guide){guide.hidden=true;floweeTap.setAttribute('aria-expanded','false');root.clearTimeout(speechTimer);speechTimer=root.setTimeout(()=>{if(doc.body.dataset.sceneExpanded!=='true'){guide.hidden=false;floweeTap.setAttribute('aria-expanded','true');frame();}},root.matchMedia?.('(prefers-reduced-motion: reduce)').matches?0:700);}viewKey=nextViewKey;root.requestAnimationFrame(frame);}

  put(summary,text().options);put(quick,text().login);put(tip,mode==='register'?({de:'Weiter mit dem sichtbaren Button',en:'Use the visible Continue button',pt:'Usa o botão Continuar'})[doc.documentElement.lang]||'Use Continue':text().swipe);put(peek,doc.body.dataset.sceneExpanded==='true'?text().reply:text().peek);
 }
 peek.addEventListener('click',()=>{root.clearTimeout(speechTimer);const open=doc.body.dataset.sceneExpanded!=='true';doc.body.dataset.sceneExpanded=String(open);if(guide)guide.hidden=open;floweeTap.setAttribute('aria-expanded',String(!open));peek.setAttribute('aria-expanded',String(!open));sync();frame();});
 function navigate(direction){if(doc.body.dataset.accountConnecting==='true')return;
  if(!$('welcome-section').hidden){if(direction==='next')$('start-journey').click();return;}
  if(!$('story-section').hidden){if(direction==='back')$('story-back').click();else if(!['return_path','threshold'].includes($('story-section').dataset.introBeat))$('story-next').click();}
 }
 const gestures=gesture();main.addEventListener('pointerdown',e=>{const interactive=!!e.target.closest('input,textarea,select,button,a,summary,[contenteditable=true]')||e.clientX<24||e.clientX>root.innerWidth-24;gestures.down(e,interactive);if(!interactive&&['touch','pen','mouse'].includes(e.pointerType)&&(e.pointerType!=='mouse'||e.button===0)){if(e.pointerType==='mouse')e.preventDefault();try{main.setPointerCapture?.(e.pointerId);}catch{}}});
 main.addEventListener('pointercancel',()=>gestures.cancel());main.addEventListener('lostpointercapture',()=>gestures.cancel());main.addEventListener('pointerup',e=>{const direction=gestures.up(e);if(direction)navigate(direction);});
 const observer=new root.MutationObserver(sync);observer.observe(main,{subtree:true,attributes:true,attributeFilter:['hidden'],childList:true});const lang=new root.MutationObserver(sync);lang.observe(doc.documentElement,{attributes:true,attributeFilter:['lang']});
 const renderObserver=new root.MutationObserver(sync);renderObserver.observe(doc.body,{attributes:true,attributeFilter:['data-flowee-render']});
 const resize=root.ResizeObserver?new root.ResizeObserver(frame):null;resize?.observe(scene);resize?.observe(panel);if(guide)resize?.observe(guide);root.addEventListener('resize',()=>{sync();frame();});root.visualViewport?.addEventListener('resize',frame);doc.addEventListener('focusin',frame);doc.addEventListener('focusout',frame);root.addEventListener('pagehide',()=>{root.clearTimeout(speechTimer);observer.disconnect();lang.disconnect();renderObserver.disconnect();resize?.disconnect();root.visualViewport?.removeEventListener('resize',frame);doc.removeEventListener('focusin',frame);doc.removeEventListener('focusout',frame);});
 sync();frame();root.CDFSceneDialogue=Object.freeze({...api,navigate,anchor,target});
})(typeof window==='object'?window:globalThis);
