/* Opt-in local wayfinding. Session-only progress; no account, reward or location calls. */
(function(root){
 'use strict';
 const room=document.body.dataset.realm||(/artist_sanctuary(?:\.html)?$/.test(location.pathname)?'sanctuary':null);
 if(!['sanctuary','culinary','market'].includes(room))return;
 const key='cdf_flowee_room_tutorial_v1';
 const tr=(en,de,pt)=>({en,de,pt});
 const words={
  start:tr('Let Flowee guide me','Flowee zeigt mir den Weg','Deixar a Flowee guiar-me'),
  resume:tr('Flowee · Continue','Flowee · Weiter','Flowee · Continuar'),
  next:tr('Next','Weiter','Seguinte'),try:tr('Let me try','Ich probiere es','Vou experimentar'),
  skip:tr('Skip this step','Schritt überspringen','Saltar este passo'),
  pause:tr('Explore on my own','Selbst erkunden','Explorar por mim'),
  close:tr('Close · resume later','Schließen · später weiter','Fechar · continuar depois'),
  storage:tr('Progress lasts on this page only.','Fortschritt bleibt nur auf dieser Seite.','O progresso fica apenas nesta página.'),
  hint:tr('Tap Flowee when you are ready to continue.','Tippe auf Flowee, wenn du weitergehen möchtest.','Toca na Flowee quando quiseres continuar.'),
  step:tr('Step','Schritt','Passo'),
  ready:tr('Nice! Your next step is ready.','Gut! Dein nächster Schritt wartet.','Boa! O próximo passo está pronto.')
 };
 const routes={sanctuary:'/pages/artist_sanctuary.html?place=secret-garden-lx',culinary:'/pages/taste_world_hub.html',market:'/pages/bantaba_market.html'};
 function step(title,body,extra={}){return{title,body,...extra};}
 const shared={
  move:step(tr('Find your rhythm','Finde deinen Rhythmus','Encontra o teu ritmo'),tr('Move with the round joystick. Drag the scene to look around. Use + / − or pinch with two fingers to zoom. Walk a little, then tap me again.','Bewege dich mit dem runden Joystick. Ziehe die Szene zum Umschauen. Mit + / − oder zwei Fingern zoomst du. Geh ein Stück und tippe dann wieder auf mich.','Move-te com o joystick redondo. Arrasta a cena para olhar à volta. Usa + / − ou dois dedos para aproximar. Anda um pouco e volta a tocar em mim.'),{watch:'move',target:'#room-joystick'}),
  counter:step(tr('Meet a creator','Entdecke die Kreativen','Conhece quem cria'),tr('Walk towards a counter. When you are close enough, its name and an Open area button appear.','Gehe auf einen Tresen zu. Sobald du nah genug bist, erscheinen sein Name und Bereich öffnen.','Aproxima-te de um balcão. Quando estiveres perto, aparecem o nome e Abrir espaço.'),{watch:'near',target:'#room-nearby'}),
  confirm:step(tr('You choose when to enter','Du entscheidest, wann du eintrittst','Tu decides quando entrar'),tr('Tap Open area. Read the confirmation, then choose Keep exploring to practise cancelling. Afterwards you can open the creator’s shop dialogue.','Tippe auf Bereich öffnen. Lies die Rückfrage und wähle Weiter umsehen, um Abbrechen auszuprobieren. Danach kannst du den Shop-Dialog öffnen.','Toca em Abrir espaço. Lê a confirmação e escolhe Continuar a explorar para experimentar cancelar. Depois podes abrir o diálogo da loja.'),{watch:'cancel',target:'#room-enter'}),
  list:step(tr('Another way to explore','Ein anderer Weg zum Erkunden','Outra forma de explorar'),tr('Try List / 2D at the top. You can reach the same kitchens and partners without walking. Choose Enter 3D to return.','Probiere oben Liste / 2D. Dort erreichst du dieselben Küchen und Partner ohne zu laufen. Mit 3D betreten kommst du zurück.','Experimenta Lista / 2D em cima. Encontras as mesmas cozinhas e parceiros sem andar. Escolhe Entrar em 3D para voltar.'),{watch:'list',target:'#room-view-toggle'})
 };
 const steps={
  sanctuary:[
   step(tr('Welcome to your Circle','Willkommen in deinem Circle','Bem-vindo ao teu Circle'),tr('I’m Flowee. Circle D Flow connects creative people, real places and your own projects. Secret Garden LX is our first Sanctuary. Let’s visit its kitchen and market together.','Ich bin Flowee. Circle D Flow verbindet kreative Menschen, echte Orte und deine eigenen Projekte. Secret Garden LX ist unser erstes Sanctuary. Lass uns Küche und Markt gemeinsam entdecken.','Sou a Flowee. Circle D Flow liga pessoas criativas, lugares reais e os teus projetos. Secret Garden LX é o nosso primeiro Sanctuary. Vamos conhecer a cozinha e o mercado.')),
   step(tr('Explore at your pace','Erkunde in deinem Tempo','Explora ao teu ritmo'),tr('Use the round joystick to move and drag to look around. You can always pause my tour or choose the simple view.','Nutze den runden Joystick zum Bewegen und ziehe zum Umschauen. Du kannst meine Tour jederzeit pausieren oder die einfache Ansicht wählen.','Usa o joystick redondo para andar e arrasta para olhar à volta. Podes pausar a visita ou escolher a vista simples.'),{target:'#joystick-zone'}),
   step(tr('First stop: Culinary','Erster Halt: Culinary','Primeira paragem: Culinary'),tr('Culinary brings kitchens and their creators together. Akwaba Food is the first counter. Let’s go there.','Culinary bringt Küchen und ihre Kreativen zusammen. Akwaba Food ist der erste Tresen. Gehen wir hin.','Culinary junta cozinhas e quem cria. Akwaba Food é o primeiro balcão. Vamos até lá.'),{destination:'culinary'})
  ],
  culinary:[
   step(tr('Welcome to Culinary','Willkommen in Culinary','Bem-vindo a Culinary'),tr('Take a look around our restaurant. The Akwaba Food counter is ahead. More kitchens can join this space in future.','Sieh dich in unserem Restaurant um. Vor dir liegt der Akwaba-Food-Tresen. Weitere Küchen können später dazukommen.','Olha à tua volta no nosso restaurante. O balcão Akwaba Food está à frente. Mais cozinhas poderão juntar-se no futuro.')),
   shared.move,shared.counter,shared.confirm,shared.list,
   step(tr('Next: Bantaba Market','Weiter zum Bantaba Market','A seguir: Bantaba Market'),tr('Let’s discover the makers and partner stalls. Opening a stall lets you explore its information; purchases are a separate decision.','Entdecken wir die Kreativen und Partnerstände. Ein Stand öffnet seine Informationen; ein Kauf ist eine eigene Entscheidung.','Vamos descobrir criadores e bancas parceiras. Abrir uma banca mostra a sua informação; comprar é uma decisão separada.'),{destination:'market'})
  ],
  market:[
   step(tr('Welcome to Bantaba','Willkommen in Bantaba','Bem-vindo a Bantaba'),tr('This market is inspired by Lomé. Find Humble and Kreativlon.art. The central FLOW gate leads to virtual items, a different area from real partner products.','Dieser Markt ist von Lomé inspiriert. Entdecke Humble und Kreativlon.art. Das mittlere FLOW-Tor führt zu virtuellen Gegenständen, einem eigenen Bereich neben echten Partnerprodukten.','Este mercado inspira-se em Lomé. Descobre Humble e Kreativlon.art. O portal FLOW central leva a objetos virtuais, uma área distinta dos produtos reais dos parceiros.')),
   shared.move,shared.counter,shared.confirm,
   step(tr('Your card and your next chapter','Deine Karte und dein nächstes Kapitel','O teu cartão e o próximo capítulo'),tr('Your Wako Kungo Member Card lives at My Member Card with your CDF account. This local tour covers exploring; account access is checked separately. Let’s return to Secret Garden.','Deine Wako-Kungo-Member-Card findest du unter Meine Member Card mit deinem CDF-Konto. Diese lokale Tour zeigt das Erkunden; der Kontozugang wird gesondert geprüft. Kehren wir zum Secret Garden zurück.','Encontras o cartão Wako Kungo em O meu cartão com a tua conta CDF. Esta visita local mostra a exploração; o acesso à conta é verificado à parte. Vamos regressar ao Secret Garden.'),{destination:'sanctuary',finish:true})
  ]
 };
 const lang=()=>['en','de','pt'].includes(document.documentElement.lang)?document.documentElement.lang:'en';
 const text=w=>w[lang()]||w.en;
 let state={active:false,room,index:0},volatile=false,watching=false,previous=null;
 try{const saved=JSON.parse(sessionStorage.getItem(key)||'null');if(saved&&saved.active===true&&Object.hasOwn(steps,saved.room)&&Number.isInteger(saved.index)&&saved.index>=0&&saved.index<steps[saved.room].length)state=saved;}catch(_){volatile=true;}
 if(state.active&&state.room!==room)state={active:true,room,index:0};
 function save(){try{sessionStorage.setItem(key,JSON.stringify(state));}catch(_){volatile=true;}}
 const button=document.createElement('button');button.type='button';button.id='flowee-tutorial-launch';button.className='flowee-tutorial-launch';
 const fairy=document.createElement('span');fairy.className='flowee-tutorial-fairy';fairy.setAttribute('aria-hidden','true');if(root.CDFFloweeFairy)fairy.innerHTML=root.CDFFloweeFairy.svg();
 const label=document.createElement('span');button.append(fairy,label);button.setAttribute('aria-haspopup','dialog');
 const d=document.createElement('dialog');d.id='flowee-room-tutorial';d.setAttribute('aria-labelledby','flowee-tutorial-title');
 const eyebrow=document.createElement('p');eyebrow.className='flowee-tutorial-eyebrow';eyebrow.textContent='FLOWEE · YOUR WAYFINDER';
 const title=document.createElement('h2');title.id='flowee-tutorial-title';const body=document.createElement('p'),progress=document.createElement('p'),notice=document.createElement('p');
 progress.className='flowee-tutorial-progress';notice.className='flowee-tutorial-note';
 const actions=document.createElement('div');actions.className='flowee-tutorial-actions';
 const primary=document.createElement('button'),skip=document.createElement('button'),pause=document.createElement('button'),closeButton=document.createElement('button'),travel=document.createElement('a');
 for(const el of [primary,skip,pause,closeButton])el.type='button';
 closeButton.className='flowee-tutorial-close';closeButton.textContent='×';
 actions.append(primary,travel,skip,pause);d.append(closeButton,fairy.cloneNode(true),eyebrow,title,body,progress,notice,actions);
 const status=document.createElement('span');status.className='flowee-tutorial-sr';status.setAttribute('role','status');
 document.body.append(button,d,status);
 const existingGuide=document.getElementById('flowee-guide');let inlineStart=null;if(existingGuide){inlineStart=document.createElement('button');inlineStart.type='button';inlineStart.id='flowee-start-room-tour';inlineStart.addEventListener('click',()=>{existingGuide.close();show();});existingGuide.append(inlineStart);}
 function current(){return steps[room][state.index]||steps[room][0];}
 function clearHighlight(){document.querySelectorAll('[data-flowee-highlight]').forEach(el=>el.removeAttribute('data-flowee-highlight'));}
 function highlight(){clearHighlight();if(state.active&&current().target)document.querySelector(current().target)?.setAttribute('data-flowee-highlight','true');}
 function render(){const s=current();label.textContent=text(state.active?words.resume:words.start);if(inlineStart)inlineStart.textContent=text(words.start);title.textContent=text(s.title);body.textContent=text(s.body);progress.textContent=text(words.step)+' '+(state.index+1)+' / '+steps[room].length;notice.textContent=volatile?text(words.storage):s.watch?text(words.hint):'';closeButton.setAttribute('aria-label',text(words.close));primary.textContent=text(s.watch?words.try:words.next);primary.hidden=!!s.destination;travel.hidden=!s.destination;if(s.destination){travel.href=routes[s.destination];travel.textContent=text(s.title);}skip.textContent=text(words.skip);skip.hidden=!s.watch;pause.textContent=text(words.pause);highlight();}
 function close(){if(d.open){if(d.close)d.close();else d.removeAttribute('open');}previous?.focus?.();}
 function show(){if(document.querySelector('dialog[open]')&&!d.open)return;previous=document.activeElement;if(!state.active){state={active:true,room,index:0};watching=false;save();}save();render();root.dispatchEvent(new root.Event('cdf:room-modal'));if(!d.open){if(d.showModal)d.showModal();else d.setAttribute('open','');}primary.hidden?travel.focus?.():primary.focus?.();}
 function advance(){watching=false;clearHighlight();if(state.index<steps[room].length-1){state.index++;save();render();status.textContent=text(words.ready);}else{state.active=false;save();render();}}
 button.addEventListener('click',show);
 primary.addEventListener('click',()=>{if(current().watch){watching=true;highlight();close();const zone=document.getElementById('room-nearby')?.dataset.zoneId;if(current().watch==='near'&&zone&&zone!=='sanctuary-exit'&&zone!=='virtual-trades')observe('near');}else{advance();render();}});
 skip.addEventListener('click',()=>{advance();render();});
 pause.addEventListener('click',()=>{state.active=false;watching=false;save();clearHighlight();close();render();});
 closeButton.addEventListener('click',close);d.addEventListener('cancel',e=>{e.preventDefault();close();});
 travel.addEventListener('click',()=>{const s=current();state={active:!s.finish,room:s.destination,index:0};watching=false;save();clearHighlight();close();});
 function observe(kind){if(state.active&&watching&&current().watch===kind){advance();}}
 root.addEventListener('cdf:room-moved',()=>observe('move'));
 root.addEventListener('cdf:room-near',e=>{if(e.detail&&e.detail!=='sanctuary-exit'&&e.detail!=='virtual-trades')observe('near');});
 root.addEventListener('cdf:room-entry-cancel',()=>observe('cancel'));
 root.addEventListener('cdf:room-list',()=>observe('list'));
 function resume(){if(state.active&&!document.querySelector('dialog[open]'))show();}
 root.addEventListener('cdf:room-ready',resume);root.addEventListener('sanctuary:ready',resume);
 root.addEventListener('cdf:realm-render',render);new MutationObserver(render).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
 render();if(state.active&&(document.body.classList.contains('scene-room-ready')||root.SanctuaryScene?.ready))resume();
 root.addEventListener('pageshow',e=>{if(e.persisted){watching=false;if(state.room!==room){state={active:state.active,room,index:0};save();}render();}});
 root.CDFFloweeTutorial=Object.freeze({open:show,pause:()=>pause.click()});
})(window);
