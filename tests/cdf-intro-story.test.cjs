const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const story=require('../js/cdf_intro_story'),{stages}=require('../js/luvo_universe');
test('all six story beats have original copy and valid scenery in DE EN PT',()=>{for(const lang of ['de','en','pt'])for(const id of story.ids){const x=story.scene(id,lang);assert.ok(x.title&&x.body&&x.next&&x.note);assert.ok(stages[x.environment]);}assert.equal(story.scene('unknown'),null);assert.equal(story.copy('__proto__'),story.copy('en'));});
test('Sanctuary gets a narrative hint while explicit local targets stay unchanged',()=>{assert.equal(story.destination('/sanctuary?welcome=register#paths'),'/sanctuary?welcome=register&intro=first-light#paths');assert.equal(story.destination('/member-card?entry=wako'),'/member-card?entry=wako');assert.equal(story.destination('/pages/artist_sanctuary.html'),'/pages/artist_sanctuary.html?intro=first-light');});
test('external and obfuscated paths cannot become story destinations',()=>{for(const x of ['https://evil.test','//evil.test','/\\evil','/\nfoo','/%2f%2fevil','/%5cevil',null])assert.equal(story.destination(x),null);});
class Element{
 constructor(tag='div'){this.tag=tag;this.children=[];this.attrs={};this.listeners={};this.dataset={};this.hidden=false;this.open=false;this.classList={contains:()=>false};}
 append(...xs){for(const x of xs){x.parentNode=this;this.children.push(x);}}
 prepend(x){x.parentNode=this;this.children.unshift(x);}
 setAttribute(k,v){this.attrs[k]=v;if(k==='open')this.open=true;}removeAttribute(k){delete this.attrs[k];if(k==='open')this.open=false;}
 addEventListener(k,f){this.listeners[k]=f;}focus(){this.focused=true;}click(){this.onclick?.();this.listeners.click?.();}
 replaceChildren(...xs){this.children=[];this.append(...xs);}showModal(){this.open=true;}close(){this.open=false;this.listeners.close?.();}
 querySelectorAll(selector){return selector==='button'?this.children.filter(n=>n.tag==='button'):[];}
}
function arrival({query='?intro=first-light',ready=false}={}){
 const events={},timers=[],nodes={'welcome-wayfinder':new Element(),'courtyard-title':new Element(),'scene-guide':new Element(),'scene-simple':new Element()};
 nodes['welcome-wayfinder'].parentNode=new Element();let simple=false;
 const doc={documentElement:{lang:'de'},body:new Element('body'),createElement:t=>new Element(t),getElementById:id=>nodes[id]};
 doc.body.classList={contains:()=>simple};nodes['scene-simple'].onclick=()=>{simple=true;};
 const root={document:doc,location:{search:query,href:'https://cdf.test/sanctuary'+query},history:{replaceState(a,b,url){root.replaced=url;}},SanctuaryScene:ready?{ready:true}:undefined,
 addEventListener:(k,f)=>events[k]=f,dispatchEvent(){},setTimeout:f=>{timers.push(f);return 1;},clearTimeout(){},MutationObserver:class{observe(){}disconnect(){}}};
 vm.runInNewContext(fs.readFileSync('js/sanctuary_arrival.js','utf8'),{window:root,URL,URLSearchParams,Event:class{}});
 return{root,doc,events,timers,nodes,dialog:doc.body.children[0],simple:()=>simple};
}
test('ordinary Sanctuary visits do not open an unsolicited intro',()=>assert.equal(arrival({query:''}).dialog,undefined));
test('arrival waits for actual scene ready and can finish with keyboard-native dialog close',()=>{const x=arrival();assert.equal(x.doc.body.dataset.arrivalState,'loading');x.events['sanctuary:ready']();assert.equal(x.doc.body.dataset.arrivalState,'scene');assert.equal(x.dialog.children[1].textContent,'Unter Blättern');x.dialog.close();assert.equal(x.root.replaced,'/sanctuary');assert.equal(x.nodes['courtyard-title'].focused,true);});
test('failed scene and timeout both provide a simple-view narrative',()=>{for(const fail of [x=>x.events['sanctuary:unavailable'](),x=>x.timers[0]()]){const x=arrival();fail(x);assert.equal(x.doc.body.dataset.arrivalState,'simple');assert.match(x.dialog.children[2].children[1].textContent,/Ruhige Ansicht/);}});
test('user can request simple view before GPU loading completes',()=>{const x=arrival();x.dialog.children[3].children[0].click();assert.equal(x.simple(),true);assert.equal(x.doc.body.dataset.arrivalState,'simple');});
function controller(){
 const names=['story-section','start-journey','mode-login','mode-register','story-next','story-back','story-skip','story-choices','welcome-section','login-section','register-section','flowee-help','flowee-help-copy','story-title','story-count','story-body','story-note','flowee-dialogue'];
 const nodes=Object.fromEntries(names.map(id=>[id,new Element(id==='story-choices'?'div':'button')]));nodes['story-section'].hidden=true;nodes['story-next'].parentNode=new Element();
 const footer=new Element(),alternative=new Element(),events={},calls={register:0,login:0,reset:0,pulse:0},storage=new Map();
 nodes['start-journey'].onclick=()=>{calls.register++;nodes['register-section'].hidden=false;};nodes['mode-login'].onclick=()=>calls.login++;nodes['mode-register'].onclick=()=>{};
 const doc={documentElement:{lang:'de'},body:new Element(),getElementById:id=>nodes[id],querySelector:s=>s==='.account-panel footer'?footer:alternative,createElement:t=>new Element(t),addEventListener:(k,f)=>events[k]=f};
 const root={document:doc,CDFIntroStory:story,location:{search:''},CDFIdentity:{safeNext:()=>null},CDFAccountJourney:{reset:()=>calls.reset++},CDFLuvoScene:{pulse:()=>calls.pulse++},sessionStorage:{setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)}};
 vm.runInNewContext(fs.readFileSync('js/cdf_account_story.js','utf8'),{window:root,URLSearchParams});return{nodes,footer,calls,storage,events};
}
test('story choice is optional, reversible and session-only; lantern uses no account operation',()=>{const x=controller(),n=x.nodes;n['start-journey'].click();n['story-next'].click();n['story-next'].click();n['story-choices'].children[1].click();assert.equal(x.storage.get('cdf_story_intent'),'create');n['story-choices'].children[4].click();assert.equal(x.storage.size,0);n['story-next'].click();n['story-choices'].children[0].click();assert.equal(x.calls.pulse,1);assert.equal(x.calls.register,0);n['story-back'].click();assert.equal(n['story-section'].dataset.introBeat,'first_step');});
test('skip reaches an honest guest/account menu; guest reaches Sanctuary without signup',()=>{const x=controller(),n=x.nodes;n['start-journey'].click();n['story-skip'].click();assert.equal(n['story-section'].dataset.introBeat,'return_path');n['story-choices'].children[1].click();assert.equal(n['story-next'].parentNode.children[0].href,'/sanctuary?intro=first-light');assert.equal(x.calls.register,0);});
test('account choice invokes existing form and direct login stays available',()=>{const x=controller(),n=x.nodes;n['start-journey'].click();n['story-skip'].click();n['story-next'].click();assert.equal(x.calls.register,1);assert.equal(n['story-section'].hidden,true);n['mode-login'].click();assert.equal(x.calls.login,1);});


test('a late renderer cannot override an explicit simple-view choice',()=>{const x=arrival();x.dialog.children[3].children[0].click();x.events['sanctuary:ready']();assert.equal(x.doc.body.dataset.arrivalState,'simple');assert.equal(x.simple(),true);});
