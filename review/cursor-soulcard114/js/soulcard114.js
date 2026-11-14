(function(){
  'use strict';
  const model=window.CDFSoulCard114Model;
  const copy={
    de:{
      title:'SoulNexus',frame:'Ein geschlossener Einband, eine Öffnung, danach die Kapitel.',
      empty:'Leerzustand',demo:'Demodaten',large:'Größere Schrift',back:'Zurück',open:'Einmal öffnen',
      nameMissing:'Name noch nicht zugeordnet',progress:'Fortschritt noch nicht verfügbar.',card:'Keine bestätigte Mitgliedskarte.',
      favorites:'Keine verdienten Lieblingssymbole.',demoNote:'Synthetische Demodaten. Nichts davon ist geteilt oder gespeichert.',
      read:'Lesen',meeting:'Begegnung',diary:'Tagebuch',calendar:'Keine verknüpften Termine.',chronicle:'Keine belegten Einträge.',
      account:'Private Einstellungen. Speichern ist nicht verbunden.',accountButton:'Nicht speichern',accountStatus:'Nichts gespeichert.',
      interview:'Flowee fragen',skip:'Gespräch überspringen',edit:'Entwurf bearbeiten',
      role:'Rolle',biography:'Kurzbiografie',instrument:'Instrument oder Werkzeug',skills:'Bis zu drei Arten',phrase:'Persönlicher Satz',
      visits:'Besuch, ohne genaue Adresse',collaboration:'Interesse an Zusammenarbeit',contact:'Öffentlicher Kontakt',
      flip:'Karte wenden',front:'Vorderseite',backFace:'Rückseite',preview:'Vorschau, noch nicht geteilt',none:'Noch keine Angabe gewählt.',
      jam:'Für eine Jam vormerken',jamStatus:'Entwurf zur Teilnahme. Keine bestätigte Buchung.',
      privateLead:'Private Notiz. Sie erscheint auf keiner Kartenseite.',communityLead:'Community-Entwurf. Veröffentlichen bleibt gesperrt.',
      privateButton:'Nicht speichern',communityButton:'Veröffentlichen gesperrt',privateStatus:'Keine Journalverbindung. Nichts gespeichert.',communityStatus:'Freigabe ausstehend. Nichts veröffentlicht.',
      labels:{pass:'Pass',chronicle:'Chronik',collection:'Sammlung',calendar:'Kalender',account:'Konto'},
      fields:{name:'Name',avatar:'Avatar',role:'Rolle',biography:'Biografie',instrument:'Instrument',skills:'Arten',phrase:'Satz',symbols:'Zeichen',visits:'Besuche',collaboration:'Zusammenarbeit',contacts:'Kontakte'}
    }
  };
  const t=()=>copy.de;
  let data=model.emptyState(),flow=model.initial(),draft=blankDraft(),large=false,selected=[];
  const $=id=>document.getElementById(id);
  function el(tag,text,parent,cls){const node=document.createElement(tag);if(text)node.textContent=text;if(cls)node.className=cls;parent.append(node);return node;}
  function blankDraft(){return {avatar:'',role:'',biography:'',instrument:'',skills:'',phrase:'',visits:'',collaboration:'',contact:''};}
  function source(){
    const skills=draft.skills.split(',').map(item=>item.trim()).filter(Boolean);
    return {profile:{name:data.profile.name},card:{avatar:draft.avatar,role:draft.role,biography:draft.biography,instrument:draft.instrument,skills,phrase:draft.phrase,collaboration:draft.collaboration,contacts:draft.contact?[{kind:'instagram',value:draft.contact}]:[]},symbols:data.symbols,visits:draft.visits?[{title:draft.visits}]:[]};
  }
  function renderCard(){
    const host=$('identity');host.replaceChildren();
    if(data.mode==='demo')el('p',t().demoNote,host);
    el('p','CIRCLE D FLOW',host);el('h2',data.profile.name||t().nameMissing,host);
    el('p',t().progress,host);el('p',t().card,host);
    const marks=(data.symbols||[]).filter(item=>item.earned&&!item.private).slice(0,3);
    if(!marks.length)el('p',t().favorites,host);
    marks.forEach(item=>el('p',item.label+(data.mode==='demo'?' · Demo, kein Kontobeleg':''),host));
  }
  function renderPaper(){
    const host=$('paper');host.replaceChildren();
    el('h3',t().labels[flow.chapter],host);
    const scroll=el('div','',host,'scroll');scroll.id='chapter-scroll';scroll.dataset.scroll='true';scroll.tabIndex=0;
    if(flow.chapter==='pass')el('p',t().frame,scroll);
    if(flow.chapter==='chronicle')el('p',t().chronicle,scroll);
    if(flow.chapter==='collection')el('p',t().favorites,scroll);
    if(flow.chapter==='calendar')el('p',t().calendar,scroll);
    if(flow.chapter==='account'){
      const form=el('form','',scroll);form.dataset.scroll='true';form.addEventListener('submit',event=>{event.preventDefault();$('account-status').textContent=t().accountStatus;});
      el('p',t().account,form);const mail=el('label','E-Mail',form);const input=el('input','',mail);input.type='email';input.autocomplete='off';
      const save=el('button',t().accountButton,form);save.type='submit';el('p','',form).id='account-status';
    }
  }
  function renderRegisters(){
    const nav=$('register');nav.replaceChildren();
    for(const id of model.CHAPTERS){
      const button=el('button',t().labels[id],nav);button.type='button';button.id='register-'+id;
      button.setAttribute('aria-current',flow.chapter===id?'page':'false');
      button.addEventListener('click',()=>{flow=model.reduce(flow,{type:'chapter',chapter:id});render();button.focus();});
    }
  }
  function faceText(card,side){
    const values=card[side];const keys=Object.keys(values);
    if(!keys.length)return t().none;
    return keys.map(key=>{const value=values[key];const shown=Array.isArray(value)?value.map(item=>item.label||item.value||item).join(', '):value;return t().fields[key]+': '+shown;}).join('\n');
  }
  function renderPreview(){
    const card=model.present(source(),selected);
    $('face-front').textContent=t().front+'\n'+faceText(card,'front');
    $('face-back').textContent=t().backFace+'\n'+faceText(card,'back');
    $('face-front').hidden=flow.face!=='front';
    $('face-back').hidden=flow.face!=='back';
    $('flip').setAttribute('aria-pressed',String(flow.face==='back'));
  }
  function show(){
    $('cover').hidden=flow.phase!=='closed';
    $('book').hidden=flow.phase!=='book';
    $('meeting').hidden=flow.phase!=='meeting';
    $('read').hidden=flow.phase!=='read';
    $('diary').hidden=flow.phase!=='diary';
  }
  function render(){
    document.body.dataset.text=large?'large':'normal';
    $('title').textContent=t().title;$('open-cover').textContent=t().open;
    $('mode-empty').setAttribute('aria-pressed',String(data.mode!=='demo'));
    $('mode-demo').setAttribute('aria-pressed',String(data.mode==='demo'));
    renderCard();renderRegisters();renderPaper();renderPreview();
    const read=$('read');read.replaceChildren();el('h2',t().labels[flow.chapter],read);const detail=el('div','',read,'scroll');detail.dataset.scroll='true';detail.tabIndex=0;detail.textContent=$('paper').innerText;
    show();
    $('status').textContent=t().labels[flow.chapter];
    $('book').dataset.opens=String(flow.opens);
  }
  function back(){
    const memory=flow.memory;
    flow=model.reduce(flow,{type:'back'});
    render();
    if(memory){const target=document.getElementById(memory.focusId);target?.focus();}
  }
  function openLayer(type){
    flow=model.reduce(flow,{type,focusId:document.activeElement?.id||'',scrollTop:$('chapter-scroll')?.scrollTop||0});
    render();
  }
  $('open-cover').addEventListener('click',()=>{flow=model.reduce(flow,{type:'open'});render();$('register-pass')?.focus();});
  $('mode-empty').addEventListener('click',()=>{data=model.emptyState();draft=blankDraft();selected=[];render();});
  $('mode-demo').addEventListener('click',()=>{data=model.demoState();draft=blankDraft();selected=[];render();});
  $('view-large').addEventListener('click',()=>{large=!large;$('view-large').setAttribute('aria-pressed',String(large));render();});
  $('back').addEventListener('click',back);
  $('action-read').addEventListener('click',()=>openLayer('read'));
  $('action-meeting').addEventListener('click',()=>openLayer('meeting'));
  $('action-diary').addEventListener('click',()=>openLayer('diary'));
  $('interview-skip').addEventListener('click',()=>{$('interview-status').textContent=t().skip;});
  $('interview-apply').addEventListener('click',()=>{
    const patch=model.interviewPatch({role:$('ask-role').value,instrument:$('ask-instrument').value,skills:$('ask-skills').value.split(','),phrase:$('ask-phrase').value,collaboration:$('ask-collaboration').value});
    draft={...draft,...patch,skills:patch.skills.join(', ')};
    ['role','instrument','phrase','collaboration'].forEach(key=>{const field=$('edit-'+key);if(field)field.value=draft[key]||'';});
    $('edit-skills').value=draft.skills;$('interview-status').textContent=t().edit;
  });
  document.querySelectorAll('[data-choice]').forEach(input=>input.addEventListener('change',()=>{selected=[...document.querySelectorAll('[data-choice]:checked')].map(item=>item.dataset.choice);renderPreview();}));
  ['avatar','role','biography','instrument','skills','phrase','visits','collaboration','contact'].forEach(key=>{
    $('edit-'+key).addEventListener('input',()=>{draft[key]=$('edit-'+key).value;renderPreview();});
  });
  $('flip').addEventListener('click',()=>{flow=model.reduce(flow,{type:'flip'});renderPreview();});
  $('soulcard').addEventListener('keydown',event=>{
    if(event.target.closest('input,textarea,select'))return;
    if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();flow=model.reduce(flow,{type:'flip'});renderPreview();}
  });
  $('jam').addEventListener('click',()=>{const draftJam=model.jamDraft(draft.collaboration||draft.phrase);$('jam-status').textContent=draftJam.booked?'' :t().jamStatus;});
  $('private-form').addEventListener('submit',event=>{event.preventDefault();const note=model.privateNote($('private-note').value);$('private-status').textContent=note.saved?'':t().privateStatus;});
  $('community-form').addEventListener('submit',event=>{event.preventDefault();const note=model.communityDraft($('community-note').value);$('community-status').textContent=note.publish?'':t().communityStatus;});
  let start=null;
  $('book').addEventListener('pointerdown',event=>{if(event.button!==0||flow.phase!=='book')return;start={x:event.clientX,y:event.clientY,id:event.pointerId,origin:event.target.closest('[data-scroll],input,textarea,select')?'scroll':'page'};});
  $('book').addEventListener('pointerup',event=>{
    if(!start||start.id!==event.pointerId)return;
    const next=model.chapterAfterGesture(model.CHAPTERS.indexOf(flow.chapter),event.clientX-start.x,event.clientY-start.y,start.origin);
    start=null;const id=model.CHAPTERS[next];
    if(id!==flow.chapter){flow=model.reduce(flow,{type:'chapter',chapter:id});render();}
  });
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'){back();return;}
    if(flow.phase!=='book'||event.target.closest?.('input,textarea,select,[data-scroll]'))return;
    if(!['ArrowDown','ArrowUp'].includes(event.key))return;
    event.preventDefault();
    const next=model.chapterAfterGesture(model.CHAPTERS.indexOf(flow.chapter),0,event.key==='ArrowDown'?80:-80,'page');
    const id=model.CHAPTERS[next];
    if(id!==flow.chapter){flow=model.reduce(flow,{type:'chapter',chapter:id});render();}
  });
  function reduced(){return window.matchMedia('(prefers-reduced-motion: reduce)').matches;}
  document.body.dataset.motion=reduced()?'reduced':'full';
  render();
})();
