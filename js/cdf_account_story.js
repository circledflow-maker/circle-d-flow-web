/* Optional original prologue. Reuses existing forms; never creates an account itself. */
(function(root){'use strict';
 const doc=root.document,$=id=>doc.getElementById(id),host=$('story-section'),data=root.CDFIntroStory;if(!host||!data)return;
 const originalStart=$('start-journey').onclick,originalLogin=$('mode-login').onclick,originalRegister=$('mode-register').onclick;
 let index=0,selected=-1,history=[];const language=()=>doc.documentElement.lang,t=()=>data.copy(language());
 const query=new URLSearchParams(root.location.search),requested=root.CDFIdentity?.safeNext(query.get('next'));
 const target=data.destination(requested||'/sanctuary')||'/sanctuary?intro=first-light',isSanctuary=/^\/(sanctuary|pages\/artist_sanctuary(?:\.html)?)(?:\?|$)/.test(target);
 const primary=$('story-next'),back=$('story-back'),skip=$('story-skip'),choices=$('story-choices');
 const arrival=doc.createElement('a');arrival.className='primary story-arrival';arrival.href=target;arrival.hidden=true;primary.parentNode.append(arrival);
 const guestEntry=doc.createElement('button');guestEntry.type='button';guestEntry.className='text-button story-guest-entry';doc.querySelector('.account-panel footer').prepend(guestEntry);
 function remember(){try{if(selected>=0)root.sessionStorage.setItem('cdf_story_intent',['explore','create','learn','community'][selected]);else root.sessionStorage.removeItem('cdf_story_intent');}catch{}}
 function hide(){host.hidden=true;delete doc.body.dataset.introScene;$('flowee-help').hidden=false;$('flowee-help-copy').hidden=true;}
 function exit(action){remember();hide();action();}
 function toRegister(){exit(originalStart);}
 function toLogin(){exit(originalLogin);}
 function present(next,push=true){
  if(push&&next!==index)history.push(index);index=next;$('welcome-section').hidden=true;$('login-section').hidden=true;$('register-section').hidden=true;
  const alternative=doc.querySelector('.alternative-entry');if(alternative)alternative.hidden=true;
  root.CDFAccountJourney?.reset();host.hidden=false;render();$('story-title').focus();root.CDFAccountMotion?.enter(host,'story');
 }
 function button(label,fn,pressed){const el=doc.createElement('button');el.type='button';el.textContent=label;if(pressed!==undefined)el.setAttribute('aria-pressed',String(pressed));el.addEventListener('click',fn);choices.append(el);return el;}
 function render(){
  const text=t();guestEntry.textContent=text.explore;if(host.hidden)return;
  const s=data.scene(data.ids[index],language());doc.body.dataset.introScene=s.id;
  $('story-count').textContent=text.chapter+' · '+(index+1)+' / '+data.ids.length;
  $('story-title').textContent=s.title;$('story-body').textContent=s.body;$('flowee-dialogue').textContent=s.guide;
  $('story-note').textContent=index===2&&selected>=0?text.picked:s.note;back.textContent=text.back;skip.textContent=text.skip;skip.hidden=index>=4;
  primary.textContent=s.next;primary.hidden=index===5;arrival.hidden=index!==5;arrival.textContent=isSanctuary?s.next:text.requested;
  choices.replaceChildren();choices.setAttribute('aria-label',s.title);host.dataset.introBeat=s.id;
  if(index===2){text.choices.forEach((label,i)=>button(label,()=>{selected=i;remember();render();choices.querySelectorAll('button')[i]?.focus();root.CDFAccountMotion?.fairy();},selected===i));button(text.open,()=>{selected=-1;remember();render();choices.querySelectorAll('button')[4]?.focus();});}
  if(index===3)button(text.lantern,advance);
  if(index===4){button(text.login,toLogin);button(text.guest,()=>{remember();present(5);});}
  $('flowee-help').hidden=true;$('flowee-help-copy').hidden=true;
 }
 function advance(){if(index===4){toRegister();return;}if(index===3){root.CDFAccountMotion?.fairy('ready');root.CDFLuvoScene?.pulse();}if(index<5)present(index+1);}
 primary.onclick=advance;skip.onclick=()=>present(4);back.onclick=()=>{if(history.length)present(history.pop(),false);else{hide();originalRegister();}};
 $('start-journey').onclick=()=>{history=[];present(0,false);};
 $('mode-login').onclick=toLogin;$('mode-register').onclick=()=>exit(originalRegister);
 guestEntry.onclick=()=>{history=[];remember();present(5,false);};
 doc.addEventListener('keydown',event=>{if(event.key==='Escape'&&!host.hidden){event.preventDefault();if(index<4)present(4);else{hide();originalRegister();}}});
 root.CDFAccountStory={refresh:render};render();
})(window);
