/* Local room travel only: no identity, rewards, sensors or payments. */
(function () {
 'use strict';
 const paths=['/pages/taste_world_hub.html','/pages/bantaba_market.html','/pages/artist_sanctuary.html'],key='cdf_room_arrival_v1';
 const messages={
 en:{title:'Crossing into your next room',culinary:'Culinary · kitchens and their creators',market:'Bantaba · makers and discoveries',sanctuary:'Secret Garden · your shared courtyard',loading:'Opening the next room…',failed:'This room could not be opened. You can retry or stay here.',retry:'Try again',cancel:'Stay here',back:'Return to Sanctuary'},
 de:{title:'Dein nächster Raum wartet',culinary:'Culinary · Küchen und ihre Kreativen',market:'Bantaba · Gestalten und Entdecken',sanctuary:'Secret Garden · dein gemeinsamer Hof',loading:'Der nächste Raum wird geöffnet…',failed:'Dieser Raum konnte nicht geöffnet werden. Versuche es erneut oder bleibe hier.',retry:'Erneut versuchen',cancel:'Hier bleiben',back:'Zurück zum Sanctuary'},
 pt:{title:'A caminho da próxima sala',culinary:'Culinary · cozinhas e os seus criadores',market:'Bantaba · criar e descobrir',sanctuary:'Secret Garden · o teu pátio partilhado',loading:'A abrir a próxima sala…',failed:'Não foi possível abrir esta sala. Tenta novamente ou fica aqui.',retry:'Tentar novamente',cancel:'Ficar aqui',back:'Voltar ao Sanctuary'}
 };
 let lang=document.documentElement.lang?.slice(0,2)||'en';try{lang=localStorage.getItem('cdf_lang')||lang;}catch(_){}
 const t=messages[lang]||messages.en;
 let dialog,target=null,controller=null,generation=0,timer=null,previous=null,incoming=false;
 function safe(value) {
  try {
   const u=new URL(value,location.origin),base=u.pathname.endsWith('.html')?u.pathname:u.pathname+'.html';
   if(u.origin!==location.origin||u.username||u.password||u.hash||!paths.includes(base))return null;
   const entries=Array.from(u.searchParams);
   if(entries.length && !(base==='/pages/artist_sanctuary.html'&&entries.length===1&&entries[0][0]==='place'&&entries[0][1]==='secret-garden-lx'))return null;
   return base+(entries.length?'?place=secret-garden-lx':'');
  }catch(_){return null;}
 }
 function room(route){return route.includes('taste_world')?'culinary':route.includes('bantaba_market')?'market':'sanctuary';}
 function clearMarker(){try{sessionStorage.removeItem(key);}catch(_){}}
 function build() {
  if(dialog)return;
  dialog=document.createElement('dialog');dialog.id='room-transition';dialog.setAttribute('aria-labelledby','room-transition-title');dialog.setAttribute('aria-describedby','room-transition-status');
  dialog.innerHTML='<div class="room-travel-art"><img src="/assets/room_loading/courtyard-door.svg" alt=""></div><p class="room-travel-eyebrow">CIRCLE D FLOW</p><h2 id="room-transition-title"></h2><p id="room-transition-destination"></p><p id="room-transition-status" role="status" aria-live="polite"></p><div class="room-travel-pulse" aria-hidden="true"></div><div class="room-travel-actions"><button type="button" id="room-transition-retry" hidden></button><button type="button" id="room-transition-cancel"></button></div>';
  document.body.append(dialog);
  dialog.querySelector('h2').textContent=t.title;
  dialog.querySelector('#room-transition-retry').textContent=t.retry;
  dialog.querySelector('#room-transition-retry').addEventListener('click',()=>incoming?location.reload():go(target));
  dialog.querySelector('#room-transition-cancel').addEventListener('click',cancel);
  dialog.addEventListener('cancel',e=>{e.preventDefault();cancel();});
  dialog.addEventListener('keydown',e=>{
   if(e.key==='Escape'){e.preventDefault();cancel();}
   if(e.key==='Tab'){
    const buttons=Array.from(dialog.querySelectorAll('button')).filter(b=>!b.hidden&&!b.disabled);
    const index=buttons.indexOf(document.activeElement),next=(index+(e.shiftKey?-1:1)+buttons.length)%buttons.length;
    e.preventDefault();buttons[next]?.focus();
   }
  });
 }
 function show(route,isIncoming){
  build();incoming=isIncoming;target=route;previous=document.activeElement;
  dialog.querySelector('#room-transition-destination').textContent=t[room(route)];
  dialog.querySelector('#room-transition-status').textContent=t.loading;
  dialog.querySelector('#room-transition-retry').hidden=true;
  dialog.querySelector('#room-transition-cancel').textContent=isIncoming?t.back:t.cancel;
  dialog.classList.remove('has-error');
  if(!dialog.open){if(dialog.showModal)dialog.showModal();else dialog.setAttribute('open','');}
  dialog.querySelector('#room-transition-cancel').focus();
 }
 function close(){
  generation++;controller?.abort();controller=null;clearTimeout(timer);timer=null;clearMarker();
  if(dialog?.open){if(dialog.close)dialog.close();else dialog.removeAttribute('open');}
  if(previous?.isConnected)previous.focus?.();
 }
 function cancel(){
  const returning=incoming;close();incoming=false;
  if(returning)location.assign('/pages/artist_sanctuary.html?place=secret-garden-lx');
 }
 function fail(){
  clearTimeout(timer);timer=null;clearMarker();
  if(!dialog?.open)return;
  dialog.classList.add('has-error');
  dialog.querySelector('#room-transition-status').textContent=t.failed;
  dialog.querySelector('#room-transition-retry').hidden=false;
 }
 async function go(value){
  const route=safe(value);if(!route)return false;
  close();show(route,false);const ticket=++generation;
  controller=new AbortController();const signal=controller.signal;
  timer=setTimeout(()=>controller?.abort(),12000);
  try{
   const response=await fetch(route.replace('.html',''),{method:'GET',credentials:'omit',redirect:'error',signal,headers:{Accept:'text/html'}});
   if(!response.ok||!response.headers.get('content-type')?.includes('text/html'))throw Error('Room unavailable');
   await response.text();
   if(ticket!==generation)return false;
   clearTimeout(timer);timer=null;
   try{sessionStorage.setItem(key,JSON.stringify({route,at:Date.now()}));}catch(_){}
   location.assign(route);return true;
  }catch(_){if(ticket===generation)fail();return false;}
 }
 window.CDFRoomTransition=Object.freeze({go,arrived:close,fail});
 document.addEventListener('click',e=>{
  if(e.defaultPrevented||e.button!==0||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey||dialog?.open)return;
  const a=e.target.closest?.('a[href]');
  if(!a||a.hasAttribute('download')||(a.target&&a.target!=='_self'))return;
  const route=safe(a.getAttribute('href'));if(!route)return;
  e.preventDefault();go(route);
 });
 window.addEventListener('pageshow',e=>{if(e.persisted){close();incoming=false;}});
 window.addEventListener('pagehide',()=>{generation++;controller?.abort();clearTimeout(timer);});
 window.addEventListener('sanctuary:ready',close);
 window.addEventListener('sanctuary:unavailable',close);
 let marker=null;try{marker=JSON.parse(sessionStorage.getItem(key)||'null');}catch(_){}
 clearMarker();
 const here=safe(location.pathname+location.search);
 if(here&&marker&&safe(marker.route)===here&&Date.now()-marker.at>=0&&Date.now()-marker.at<60000)show(here,true);
 else if(['culinary','market'].includes(document.body.dataset.realm))show(here||'/pages/taste_world_hub.html',true);
})();

