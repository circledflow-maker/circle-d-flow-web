const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
function setup({reduced=false,supported=true}={}){
 const events={},media={matches:reduced,addEventListener:(name,fn)=>events.preference=fn};
 const nodes={};function node(){const n={effects:[],querySelector:selector=>nodes[selector]};if(supported)n.animate=(frames,options)=>{const a={frames,options,cancelled:false,cancel(){this.cancelled=true;this.oncancel?.();}};n.effects.push(a);return a;};return n;}
 for(const key of ['cdf-account-flowee','flowee-dialogue','.pass-card','.pass-seal'])nodes[key]=node();
 const document={hidden:false,body:{dataset:{}},getElementById:id=>nodes[id],addEventListener:(name,fn)=>events[name]=fn};
 const window={matchMedia:()=>media,addEventListener:(name,fn)=>events[name]=fn};
 vm.runInNewContext(fs.readFileSync('js/cdf_account_motion.js','utf8'),{window,document});return{api:window.CDFAccountMotion,document,media,events,nodes,node};
}
test('reduced motion keeps scene state but starts no animation',()=>{const x=setup({reduced:true});const pane=x.node();x.api.enter(pane,'ready');assert.equal(pane.effects.length,0);assert.equal(x.nodes['cdf-account-flowee'].effects.length,0);assert.equal(x.document.body.dataset.journeyScene,'ready');});
test('rapid steps cancel old effects without waiting or disabling controls',()=>{const x=setup(),pane=x.node();x.api.enter(pane);const first=pane.effects[0];x.api.enter(pane);assert.equal(first.cancelled,true);assert.equal(pane.effects.length,2);assert.equal(pane.disabled,undefined);assert.equal(pane.effects[1].options.duration,300);});
test('preference and background changes cancel active effects immediately',()=>{const x=setup(),pane=x.node();x.api.enter(pane);x.media.matches=true;x.events.preference();assert.equal(pane.effects[0].cancelled,true);x.media.matches=false;x.api.enter(pane);x.document.hidden=true;x.events.visibilitychange();assert.equal(pane.effects[1].cancelled,true);x.api.enter(pane);assert.equal(pane.effects.length,2);});
test('pass and seal reveal is reserved for ready presentation; unsupported animation remains usable',()=>{const x=setup(),pane=x.node();x.api.enter(pane,'pending');assert.equal(x.nodes['.pass-card'].effects.length,0);x.api.enter(pane,'ready');assert.equal(x.nodes['.pass-card'].effects.length,1);assert.equal(x.nodes['.pass-seal'].effects.length,1);x.events.pagehide();assert.equal(x.nodes['.pass-card'].effects[0].cancelled,true);const old=setup({supported:false});assert.doesNotThrow(()=>old.api.enter(old.node(),'ready'));});
