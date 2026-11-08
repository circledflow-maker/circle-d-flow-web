/* Injected only by the local design-preview server; never handles account fields. */
(function(root){'use strict';
root.addEventListener('DOMContentLoaded',()=>{
 const doc=root.document,story=root.CDFAccountStory;if(!story)return;
 const box=doc.createElement('div');box.setAttribute('role','note');box.style.cssText='position:relative;z-index:5;display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding:4px 10px;background:#173b3b;color:#effff6;font:12px system-ui';
 const status=doc.createElement('span'),connect=doc.createElement('button'),link=doc.createElement('a'),leave=doc.createElement('button');
 connect.type=leave.type='button';connect.textContent='Geräte verbinden';leave.textContent='Verbindung trennen';link.textContent='Kopplungslink für anderes Gerät';link.style.color='#b6e8d4';link.hidden=leave.hidden=true;status.textContent='Fortschritt bisher nur auf diesem Gerät';box.append(status,connect,link,leave);doc.body.prepend(box);
 let token=new URLSearchParams(root.location.hash.slice(1)).get('pair'),revision=-1,applying=false,busy=false,pending=null,last='',timer=null;
 const allowed=/^[a-f0-9]{48}$/;
 function local(){return story.snapshot();}
 function show(message){status.textContent=message;}
 async function request(method,payload){const response=await root.fetch('/__preview/session',{method,headers:{'Content-Type':'application/json','X-CDF-Preview-Session':token||''},body:payload?JSON.stringify(payload):undefined,cache:'no-store'});const data=await response.json();if(!response.ok&&response.status!==409)throw Error(String(response.status));return data;}
 function apply(data){revision=data.revision;last=JSON.stringify(data.state);if(JSON.stringify(local())!==last){applying=true;try{const ok=story.restore(data.state);show(ok?'Gekoppelt · Intro und Richtungswahl synchron':'Gekoppelt · Kontoeingaben bleiben lokal');}finally{applying=false;}}else show('Gekoppelt · Intro und Richtungswahl synchron');}
 function controls(){connect.hidden=!!token;link.hidden=leave.hidden=!token;if(token)link.href=root.location.origin+root.location.pathname+root.location.search+'#pair='+token;}
 async function flush(){if(busy||!token||!pending)return;busy=true;const state=pending;pending=null;try{const data=await request('PUT',{revision,state});apply(data);}catch{show('Verbindung unterbrochen · erneut versuchen');}finally{busy=false;if(pending)flush();}}
 async function poll(){if(!token||busy||doc.hidden)return;busy=true;try{apply(await request('GET'));}catch{show('Verbindung nicht erreichbar oder abgelaufen');}finally{busy=false;if(pending)flush();}}
 async function pair(){try{const data=await request('POST',{state:local()||{step:'city_light',intent:null}});token=data.token;root.history.replaceState(null,'',root.location.pathname+root.location.search+'#pair='+token);controls();apply(data);}catch{show('Kopplung konnte nicht gestartet werden');}}
 connect.addEventListener('click',pair);
 leave.addEventListener('click',()=>{token=null;pending=null;revision=-1;root.history.replaceState(null,'',root.location.pathname+root.location.search);controls();show('Verbindung auf diesem Gerät getrennt');});
 root.addEventListener('cdf:story-state',e=>{if(!token||applying||!e.detail)return;const json=JSON.stringify(e.detail);if(json===last)return;pending=e.detail;flush();});
 doc.addEventListener('visibilitychange',()=>{if(!doc.hidden)poll();});
 root.addEventListener('pagehide',()=>root.clearInterval(timer));controls();
 if(token&&!allowed.test(token)){token=null;controls();show('Ungültiger Kopplungslink');}
 if(token)poll();timer=root.setInterval(poll,2000);
});
})(window);
