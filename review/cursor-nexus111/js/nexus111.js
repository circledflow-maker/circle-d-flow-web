(function(){
  'use strict';
  const model=window.CDFNexus111Model;
  const coverApi=window.CDFNexus111Cover;
  const integrate=window.CDFNexus111Integrate;
  const copy={
    de:{
      title:'SoulNexus',frame:'Ein Einband, eine Öffnung, danach eine Buchoberfläche.',
      empty:'Leerzustand',demo:'Demodaten',large:'Größere Schrift',back:'Zurück',open:'Einband öffnen',
      missing:'CDFCover111 ist in diesem Checkout nicht vorhanden. Dieser Einband ist nur die Öffnungsstelle.',
      bound:'CDFCover111 ist verbunden.',
      nameMissing:'Name noch nicht zugeordnet',progress:'Fortschritt noch nicht verfügbar.',card:'Keine bestätigte Mitgliedskarte.',
      favorites:'Keine verdienten Lieblingssymbole.',demoNote:'Synthetische Demodaten. Kein Fortschritt, keine Termine, kein Speichererfolg.',
      demoSymbol:'Demo, kein Kontobeleg.',
      read:'Lesen',share:'Begegnung',journal:'Tagebuch',
      calendar:'Keine verknüpften Termine.',
      chronicle:'Keine belegten Einträge.',
      account:'Private Einstellungen. Speichern ist nicht verbunden.',accountButton:'Nicht speichern',accountStatus:'Nichts gespeichert.',
      journalLead:'Private Notiz. Sie gehört nicht in die Begegnung.',journalButton:'Nicht speichern',journalStatus:'Nichts gespeichert.',
      shareTitle:'Sichtbare Felder',shareIntro:'Nur angehakte Felder erscheinen. Nichts wird gesendet.',shareEmpty:'Noch keine Angaben ausgewählt.',
      privacy:'E-Mail, Tagebuch, Guthaben und Kontoeinstellungen bleiben außen.',notProof:'Freiwillige Vorschau · kein Nachweis und kein QR.',close:'Schließen',
      labels:{pass:'Pass',chronicle:'Chronik',collection:'Sammlung',calendar:'Kalender',account:'Konto'},
      shareLabels:{name:'Name',level:'Level',interests:'Interessen',symbols:'Gesammelte Zeichen',instagram:'Instagram',tiktok:'TikTok',discord:'Discord'},
      symbols:{'orientation-first-step-v1':'Erster Schritt','cdf-demo-lantern':'Laterne','cdf-demo-seal':'Siegelspur'}
    },
    en:{
      title:'SoulNexus',frame:'One cover, one opening, then one book surface.',
      empty:'Empty',demo:'Demo data',large:'Larger type',back:'Back',open:'Open cover',
      missing:'CDFCover111 is not in this checkout. This cover is only the opening point.',
      bound:'CDFCover111 is connected.',
      nameMissing:'Name not assigned yet',progress:'Progress is not available.',card:'No confirmed member card.',
      favorites:'No earned favourite symbols.',demoNote:'Synthetic demo data. No progress, events or saved result.',
      demoSymbol:'Demo, not an account record.',
      read:'Read',share:'Meeting',journal:'Diary',
      calendar:'No linked events.',chronicle:'No confirmed entries.',
      account:'Private settings. Saving is not connected.',accountButton:'Do not save',accountStatus:'Nothing was saved.',
      journalLead:'Private note. It is not part of the meeting export.',journalButton:'Do not save',journalStatus:'Nothing was saved.',
      shareTitle:'Visible fields',shareIntro:'Only checked fields appear. Nothing is sent.',shareEmpty:'No details selected yet.',
      privacy:'Email, diary, balances and account settings stay out.',notProof:'Voluntary preview · not proof and not a QR code.',close:'Close',
      labels:{pass:'Pass',chronicle:'Chronicle',collection:'Collection',calendar:'Calendar',account:'Account'},
      shareLabels:{name:'Name',level:'Level',interests:'Interests',symbols:'Collected symbols',instagram:'Instagram',tiktok:'TikTok',discord:'Discord'},
      symbols:{'orientation-first-step-v1':'First step','cdf-demo-lantern':'Lantern','cdf-demo-seal':'Seal trace'}
    },
    pt:{
      title:'SoulNexus',frame:'Uma capa, uma abertura, depois uma superfície de livro.',
      empty:'Vazio',demo:'Dados de demonstração',large:'Letra maior',back:'Voltar',open:'Abrir capa',
      missing:'CDFCover111 não está neste checkout. Esta capa é só o ponto de abertura.',
      bound:'CDFCover111 está ligado.',
      nameMissing:'Nome ainda não atribuído',progress:'Progresso indisponível.',card:'Sem Member Card confirmado.',
      favorites:'Sem símbolos favoritos confirmados.',demoNote:'Dados sintéticos. Sem progresso, eventos ou gravação.',
      demoSymbol:'Demonstração, sem registo de conta.',
      read:'Ler',share:'Encontro',journal:'Diário',
      calendar:'Sem eventos ligados.',chronicle:'Sem registos confirmados.',
      account:'Definições privadas. Guardar não está ligado.',accountButton:'Não guardar',accountStatus:'Nada foi guardado.',
      journalLead:'Nota privada. Não entra na exportação do encontro.',journalButton:'Não guardar',journalStatus:'Nada foi guardado.',
      shareTitle:'Campos visíveis',shareIntro:'Só os campos marcados aparecem. Nada é enviado.',shareEmpty:'Ainda sem dados.',
      privacy:'Email, diário, saldos e definições ficam de fora.',notProof:'Pré-visualização voluntária · sem comprovativo e sem QR.',close:'Fechar',
      labels:{pass:'Passe',chronicle:'Crónica',collection:'Coleção',calendar:'Calendário',account:'Conta'},
      shareLabels:{name:'Nome',level:'Nível',interests:'Interesses',symbols:'Símbolos recolhidos',instagram:'Instagram',tiktok:'TikTok',discord:'Discord'},
      symbols:{'orientation-first-step-v1':'Primeiro passo','cdf-demo-lantern':'Lanterna','cdf-demo-seal':'Rastra do selo'}
    }
  };
  let lang='de',data=model.emptyState(),book=model.initial(),large=false,dialog=null;
  const $=id=>document.getElementById(id);
  const t=()=>copy[lang]||copy.de;
  function el(tag,text,parent,cls){const node=document.createElement(tag);if(text)node.textContent=text;if(cls)node.className=cls;parent.append(node);return node;}
  function chapterIndex(){return model.CHAPTERS.indexOf(book.chapter);}
  function paper(){return $('paper');}
  function rememberFocus(){return document.activeElement?.id||'action-read';}
  function openBook(){book=model.reduce(book,{type:'open'});render();}
  const binding=coverApi.bind(window.CDFCover111,$('cover-host'),openBook);
  $('open-cover').onclick=()=>binding.openOnce();
  function renderCard(){
    const c=t(),host=$('card');host.replaceChildren();
    if(data.mode==='demo')el('p',c.demoNote,host);
    el('div','✧',host,'emblem');
    el('p','CIRCLE D FLOW',host);
    el('h2',data.profile.name||c.nameMissing,host);
    const level=model.progress(data.profile.exp);
    el('p',level?String(level.level):c.progress,host);
    el('p',c.card,host);
    const marks=model.favorites(data);
    if(!marks.length)el('p',c.favorites,host);
    else marks.forEach(item=>{const row=el('div','',host,'symbol');el('div','✧',row,'mark');el('p',(c.symbols[item.id]||item.id)+(data.mode==='demo'?' · '+c.demoSymbol:''),row);});
  }
  function renderPaper(){
    const c=t(),host=paper();host.replaceChildren();
    el('h3',c.labels[book.chapter],host);
    const scroll=el('div','',host,'scroll');scroll.dataset.scroll='true';scroll.tabIndex=0;scroll.id='chapter-scroll';
    if(book.chapter==='pass')el('p',c.frame,scroll);
    if(book.chapter==='chronicle'){
      const rows=[...data.chronicle.tutorial,...data.chronicle.visits,...data.chronicle.encounters];
      if(!rows.length)el('p',c.chronicle,scroll);
      rows.forEach(item=>{const block=el('article','',scroll,'entry');el('h4',item.title,block);el('p',item.origin+' · '+item.date+' · '+item.visibility,block,'meta');});
    }
    if(book.chapter==='collection'){
      const earned=new Set(model.favorites(data).map(item=>item.id));
      if(!earned.size)el('p',c.favorites,scroll);
      earned.forEach(id=>el('p',(c.symbols[id]||id),scroll));
    }
    if(book.chapter==='calendar')el('p',data.events.length?data.events.map(item=>item.title).join(', '):c.calendar,scroll);
    if(book.chapter==='account'){
      const form=el('form','',scroll,'account');form.dataset.scroll='true';form.addEventListener('submit',event=>{event.preventDefault();$('account-status').textContent=c.accountStatus;});
      el('p',c.account,form);
      const mail=el('label','E-Mail',form);const input=el('input','',mail);input.type='email';input.autocomplete='off';
      const save=el('button',c.accountButton,form);save.type='submit';
      el('p','',form).id='account-status';
      if(integrate.accountStatus()==='present')el('p','CdfAccount.mountSecurity',form);
    }
    scroll.scrollTop=book.scroll[book.chapter]||0;
    scroll.addEventListener('scroll',()=>{book=model.reduce(book,{type:'scroll',chapter:book.chapter,scrollTop:scroll.scrollTop});});
  }
  function renderRegisters(){
    const nav=$('register');nav.replaceChildren();
    for(const id of model.CHAPTERS){
      const button=el('button',t().labels[id],nav);button.type='button';button.id='register-'+id;
      button.setAttribute('aria-current',book.chapter===id?'page':'false');
      button.addEventListener('click',()=>{book=model.reduce(book,{type:'chapter',chapter:id});render();button.focus();});
    }
  }
  function renderActions(){
    $('action-read').textContent=t().read;$('action-share').textContent=t().share;$('action-journal').textContent=t().journal;$('back').textContent=t().back;
  }
  function renderRead(){
    const host=$('read-body');host.replaceChildren();
    el('h2',t().labels[book.chapter],host);
    el('p',t().read,host);
    const scroll=el('div','',host,'scroll');scroll.dataset.scroll='true';
    scroll.append($('paper').cloneNode(true));
  }
  function show(){
    const open=book.phase!=='closed';
    $('cover').hidden=open;
    $('book').hidden=!open||book.phase!=='book';
    $('read').hidden=book.phase!=='read';
    $('journal').hidden=book.phase!=='journal';
  }
  function render(){
    document.documentElement.lang=lang;
    document.body.dataset.text=large?'large':'normal';
    $('title').textContent=t().title;$('frame').textContent=t().frame;
    $('mode-empty').textContent=t().empty;$('mode-demo').textContent=t().demo;$('view-large').textContent=t().large;
    $('mode-empty').setAttribute('aria-pressed',String(data.mode!=='demo'));
    $('mode-demo').setAttribute('aria-pressed',String(data.mode==='demo'));
    $('cover-note').textContent=binding.source==='CDFCover111'?t().bound:t().missing;
    $('open-cover').hidden=binding.source==='CDFCover111';
    $('open-cover').textContent=t().open;
    renderCard();renderRegisters();renderPaper();renderActions();renderRead();
    const journalHost=$('journal-body');
    if(book.phase==='journal'){
      journalHost.replaceChildren();
      if(integrate.journal(journalHost)==='unavailable'){
        el('p',t().journalLead,journalHost);
        const form=el('form','',journalHost,'account');form.addEventListener('submit',event=>{event.preventDefault();$('journal-status').textContent=t().journalStatus;});
        const label=el('label',t().journal,form);const area=el('textarea','',label);area.autocomplete='off';
        const save=el('button',t().journalButton,form);save.type='submit';
        el('p','',form).id='journal-status';
      }
    }
    show();
    $('book').dataset.opens=String(book.opens);
    $('status').textContent=t().labels[book.chapter];
  }
  function back(){
    if(dialog?.open){dialog.close();return;}
    const memory=book.memory;
    book=model.reduce(book,{type:'back'});
    render();
    if(memory){
      const scroller=$('chapter-scroll');if(scroller)scroller.scrollTop=memory.scrollTop||0;
      const target=document.getElementById(memory.focusId);target?.focus();
    }
  }
  function openShare(){
    if(dialog?.open)return;
    const focusId=rememberFocus();
    const scrollTop=$('chapter-scroll')?.scrollTop||0;
    book=model.reduce(book,{type:'share',focusId,scrollTop});
    const c=t();
    dialog=document.createElement('dialog');
    const head=el('div','',dialog,'dialog-head');el('h2',c.shareTitle,head);
    const close=el('button',c.close,head);close.type='button';close.addEventListener('click',()=>dialog.close());
    const body=el('div','',dialog,'dialog-body');el('p',c.shareIntro,body);el('p',c.privacy,body);
    const options=el('fieldset','',body);const inputs=[];
    for(const key of model.SHARE_KEYS){if(!model.project(data,[key]).fields.length)continue;const label=el('label','',options);const input=el('input','',label);input.type='checkbox';input.name=key;inputs.push(input);el('span',c.shareLabels[key],label);input.addEventListener('change',refresh);}
    const preview=el('article','',body,'preview');
    function refresh(){const proj=model.project(data,inputs.filter(input=>input.checked).map(input=>input.name));preview.replaceChildren();el('h3','Circle D Flow · SoulNexus',preview);if(!proj.fields.length)el('p',c.shareEmpty,preview);for(const field of proj.fields){el('strong',c.shareLabels[field.key],preview);el('p',Array.isArray(field.value)?field.value.join(' · '):field.value,preview);}el('small',c.notProof,preview);}
    refresh();document.body.append(dialog);
    dialog.addEventListener('close',()=>{dialog.remove();dialog=null;back();},{once:true});
    dialog.showModal();close.focus();
  }
  $('mode-empty').addEventListener('click',()=>{data=model.emptyState();render();});
  $('mode-demo').addEventListener('click',()=>{data=model.demoState();render();});
  $('view-large').addEventListener('click',()=>{large=!large;$('view-large').setAttribute('aria-pressed',String(large));render();});
  $('lang').addEventListener('change',()=>{lang=$('lang').value;render();});
  $('back').addEventListener('click',back);
  $('action-read').addEventListener('click',()=>{book=model.reduce(book,{type:'read',focusId:rememberFocus(),scrollTop:$('chapter-scroll')?.scrollTop||0});render();$('read').focus();});
  $('action-share').addEventListener('click',openShare);
  $('action-journal').addEventListener('click',()=>{book=model.reduce(book,{type:'journal',focusId:rememberFocus(),scrollTop:$('chapter-scroll')?.scrollTop||0});render();$('journal').focus();});
  let start=null;
  $('book').addEventListener('pointerdown',event=>{if(event.button!==0||book.phase!=='book')return;start={x:event.clientX,y:event.clientY,id:event.pointerId,origin:event.target.closest('[data-scroll],input,textarea,select')?'scroll':'page'};});
  $('book').addEventListener('pointerup',event=>{
    if(!start||start.id!==event.pointerId)return;
    const next=model.chapterAfterGesture(chapterIndex(),event.clientX-start.x,event.clientY-start.y,start.origin);
    start=null;
    const id=model.CHAPTERS[next];
    if(id!==book.chapter){book=model.reduce(book,{type:'chapter',chapter:id});render();}
  });
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'){back();return;}
    if(book.phase!=='book')return;
    if(event.target.closest?.('input,textarea,select,[data-scroll]'))return;
    if(!['ArrowDown','ArrowUp','ArrowLeft','ArrowRight'].includes(event.key))return;
    event.preventDefault();
    const dx=event.key==='ArrowRight'?80:event.key==='ArrowLeft'?-80:0;
    const dy=event.key==='ArrowDown'?80:event.key==='ArrowUp'?-80:0;
    const next=model.chapterAfterGesture(chapterIndex(),dx,dy,'page');
    const id=model.CHAPTERS[next];
    if(id!==book.chapter){book=model.reduce(book,{type:'chapter',chapter:id});render();}
  });
  render();
})();
