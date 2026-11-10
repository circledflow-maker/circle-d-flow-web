/* Explicit private journal. No localStorage, contact import or automatic encounter tracking. */
(function(root){'use strict';
 const fail=code=>Object.assign(Error(code),{code});
 function newId(crypto){if(crypto?.randomUUID)return crypto.randomUUID();if(!crypto?.getRandomValues)throw fail('UNAVAILABLE');const bytes=crypto.getRandomValues(new Uint8Array(16));bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;const h=[...bytes].map(x=>x.toString(16).padStart(2,'0')).join('');return h.slice(0,8)+'-'+h.slice(8,12)+'-'+h.slice(12,16)+'-'+h.slice(16,20)+'-'+h.slice(20);}
 function createClient(auth,fetcher,onReset=()=>{}){
  let epoch=0,owner=null;const subscription=auth.onAuthStateChange?.((event,session)=>{if(event==='INITIAL_SESSION')return;const next=session?.user?.id||null;if(next===owner&&owner)return;owner=next;epoch++;onReset();})?.data?.subscription;
  async function request(value){const version=epoch,session=(await auth.getSession()).data?.session;if(!session?.user?.id||!session.access_token)throw fail('AUTH_REQUIRED');if(version!==epoch)throw fail('ACCOUNT_CHANGED');owner=session.user.id;
   const response=await fetcher('/api/registrations?route=private-journal',{method:value?'POST':'GET',cache:'no-store',credentials:'omit',headers:{Authorization:'Bearer '+session.access_token,'Content-Type':'application/json'},...(value?{body:JSON.stringify(value)}:{}),signal:AbortSignal.timeout(15000)});
   const data=await response.json(),current=(await auth.getSession()).data?.session;
   if(version!==epoch||current?.user?.id!==session.user.id)throw fail('ACCOUNT_CHANGED');
   if(!response.ok)throw fail(response.status===401?'AUTH_REQUIRED':response.status===403?'CONFIRMATION_REQUIRED':'UNAVAILABLE');
   if(data.memberId!==session.user.id)throw fail('UNCONFIRMED');
   if(!value&&(!Array.isArray(data.entries)||data.entries.some(x=>x.source!=='self_reported')))throw fail('UNCONFIRMED');
   if(value&&value.action!=='delete'&&(!data.entry||data.entry.id!==value.id||data.entry.source!=='self_reported'))throw fail('UNCONFIRMED');
   if(value?.action==='delete'&&data.deletedId!==value.id)throw fail('UNCONFIRMED');
   return data;
  }return {read:()=>request(),save:request,dispose(){epoch++;subscription?.unsubscribe();}};
 }
 if(typeof module==='object'&&module.exports)module.exports={createClient,newId};
 const doc=root.document;if(!doc)return;const active=new Map();
 function el(tag,text,parent){const n=doc.createElement(tag);n.textContent=text;parent.append(n);return n;}
 function button(text,parent,click){const b=el('button',text,parent);b.type='button';b.addEventListener('click',click);return b;}
 function mount(host){
  dispose(host);const en=doc.documentElement.lang==='en',pt=doc.documentElement.lang==='pt',t=(d,e,p)=>en?e:pt?p:d;
  const panel=el('section','',host);panel.className='journal78';host.insertBefore(panel,host.children[2]||null);el('h3',t('Eigene Erinnerungen','Personal memories','Memórias pessoais'),panel);
  const state=el('p',t('Privates Tagebuch wird geprüft…','Checking private journal…','A verificar diário privado…'),panel);state.setAttribute('role','status');
  const area=el('div','',panel);let alive=true,editing=null,pendingId=null,client;
  const isCurrent=()=>alive&&panel.isConnected;
  function error(e){return e.code==='ACCOUNT_CHANGED'?t('Konto gewechselt. Öffne den Pass erneut.','Account changed. Reopen the pass.','Conta alterada. Abre o passe de novo.'):t('Die private Speicherung ist noch nicht erreichbar. Es wurde hier nichts als gespeichert bestätigt.','Private storage is unavailable. No save was confirmed here.','O armazenamento privado está indisponível. Nenhuma gravação foi confirmada aqui.');}
  const reset=()=>{if(!alive)return;area.replaceChildren();state.textContent=t('Konto gewechselt. Öffne den Pass erneut.','Account changed. Reopen the pass.','Conta alterada. Abre o passe de novo.');dispose(host);};
  try{if(!root.supabaseClient?.auth)throw fail('AUTH_REQUIRED');client=createClient(root.supabaseClient.auth,root.fetch.bind(root),reset);}catch(e){state.textContent=error(e);return;}
  active.set(host,()=>{alive=false;client.dispose();panel.remove();});
  async function load(){try{const data=await client.read();if(!isCurrent())return;draw(data);}catch(e){if(!isCurrent())return;area.replaceChildren();state.textContent=error(e);button(t('Erneut prüfen','Retry','Tentar novamente'),area,load);}}
  function draw(data){
   area.replaceChildren();state.textContent=t('Nur für dich · selbst eingetragene Erinnerungen, keine bestätigte Teilnahme oder Belohnung.','Private · self-reported memories, not confirmed attendance or rewards.','Privado · memórias pessoais, não são presenças confirmadas ou recompensas.');
   el('p',t('Du bestimmst selbst, ob du Personen und Zeitpunkte notierst. Teile hier keine vertraulichen Angaben anderer. Das Tagebuch wird nicht im Begegnungspass geteilt.','You choose whether to record people and dates. Avoid others’ confidential details. The journal is excluded from your meeting pass.','Tu escolhes se registas pessoas e datas. Evita dados confidenciais de outras pessoas. O diário não integra o passe de encontro.'),area);
   const form=el('form','',area);form.className='journal78-form';
   function field(label,tag){const l=el('label',label,form);return el(tag,'',l);}
   const kind=field(t('Art der Erinnerung','Memory type','Tipo de memória'),'select');
   for(const [value,label]of [['sanctuary',t('Sanctuary-Besuch · selbst eingetragen','Sanctuary visit · self-reported','Visita ao Sanctuary · pessoal')],['encounter',t('Begegnung · selbst eingetragen','Encounter · self-reported','Encontro · pessoal')],['reflection',t('Gedanke oder nächster Schritt','Reflection or next step','Reflexão ou próximo passo')]]){const o=el('option',label,kind);o.value=value;}
   const title=field(t('Titel','Title','Título'),'input');title.required=true;title.maxLength=80;
   const when=field(t('Wann? Optional; leer bedeutet unbekannt','When? Optional; blank means unknown','Quando? Opcional; vazio significa desconhecido'),'input');when.type='datetime-local';
   const note=field(t('Deine Notiz · optional','Your note · optional','A tua nota · opcional'),'textarea');note.maxLength=1000;note.rows=4;
   const save=el('button',t('Privat speichern','Save privately','Guardar em privado'),form);save.type='submit';
   const cancel=button(t('Bearbeiten abbrechen','Cancel edit','Cancelar edição'),form,()=>{editing=null;pendingId=null;form.reset();cancel.hidden=true;save.textContent=t('Privat speichern','Save privately','Guardar em privado');});cancel.hidden=true;
   const notice=el('p','',form);notice.setAttribute('role','status');
   form.addEventListener('submit',async event=>{event.preventDefault();if(save.disabled)return;save.disabled=true;notice.textContent='';try{pendingId ||=newId(root.crypto);const value={action:editing?'update':'create',id:editing||pendingId,kind:kind.value,title:title.value,note:note.value,occurredAt:when.value?new Date(when.value).toISOString():null};await client.save(value);if(!isCurrent())return;editing=null;pendingId=null;await load();if(isCurrent())state.textContent=t('Privat gespeichert.','Saved privately.','Guardado em privado.');}catch(e){if(isCurrent())notice.textContent=error(e);}finally{if(isCurrent())save.disabled=false;}});
   if(!data.entries.length)el('p',t('Noch keine eigenen Erinnerungen.','No personal memories yet.','Ainda sem memórias pessoais.'),area);
   for(const item of data.entries){const article=el('article','',area);el('h4',item.title,article);el('small',t('Selbst eingetragen','Self-reported','Registo pessoal'),article);const date=item.occurredAt?new Date(item.occurredAt).toLocaleString(doc.documentElement.lang):t('Zeitpunkt nicht angegeben','Date not specified','Data não indicada');el('p',date,article);el('p',item.note||'',article).className='journal78-note';
    button(t('Ändern','Edit','Editar'),article,()=>{editing=item.id;pendingId=null;kind.value=item.kind;title.value=item.title;note.value=item.note||'';when.value=item.occurredAt?new Date(Date.parse(item.occurredAt)-new Date(item.occurredAt).getTimezoneOffset()*60000).toISOString().slice(0,16):'';cancel.hidden=false;save.textContent=t('Änderung privat speichern','Save private change','Guardar alteração privada');title.focus();});
    const confirm=el('div','',article);confirm.hidden=true;el('p',t('Diese Erinnerung endgültig löschen?','Permanently delete this memory?','Eliminar esta memória definitivamente?'),confirm);
    const remove=button(t('Löschen','Delete','Eliminar'),article,()=>{confirm.hidden=false;});
    button(t('Abbrechen','Cancel','Cancelar'),confirm,()=>{confirm.hidden=true;});
    button(t('Endgültig löschen','Delete permanently','Eliminar definitivamente'),confirm,async()=>{remove.disabled=true;try{await client.save({action:'delete',id:item.id});if(isCurrent())await load();}catch(e){if(isCurrent())state.textContent=error(e);}finally{if(isCurrent())remove.disabled=false;}});
   }
   if(data.hasMore)el('p',t('Die neuesten 100 Erinnerungen. Ältere Einträge bleiben gespeichert; weitere Navigation folgt.','Latest 100 memories. Older entries remain stored; further navigation is pending.','As 100 memórias mais recentes. As anteriores continuam guardadas; navegação adicional pendente.'),area);
  }
  load();
 }
 function dispose(host){if(host){active.get(host)?.();active.delete(host);}else for(const [target,cleanup]of [...active]){cleanup();active.delete(target);}}
 root.CDFPrivateJournal=Object.freeze({mount,dispose});
})(typeof window==='object'?window:globalThis);
