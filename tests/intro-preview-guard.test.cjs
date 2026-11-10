const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
function setup(final=false){
 const events={},nodes={'auth-status':{textContent:''},'cdf-google':{},'finish-account':{},'resend-confirmation':{}};
 const document={getElementById:id=>nodes[id],querySelector:()=>({hidden:!final}),addEventListener:(k,f)=>events[k]=f};
 const window={};const location={href:'https://preview.test/login',origin:'https://preview.test'};
 vm.runInNewContext(fs.readFileSync('scripts/fixtures/intro-preview-guard.js','utf8'),{window,document,location,URL,Object});
 return{events,nodes,window,location};
}
function event(id){return{target:{id},preventDefault(){this.prevented=true;},stopImmediatePropagation(){this.stopped=true;}};}
test('intermediate form navigation stays available; final registration is blocked',()=>{const x=setup(),e=event('cdf-register-form');x.events.submit(e);assert.equal(e.prevented,undefined);const y=setup(true),f=event('cdf-register-form');y.events.submit(f);assert.equal(f.prevented,true);assert.equal(f.stopped,true);assert.match(y.nodes['auth-status'].textContent,/kein Konto/);});
test('login and account controls cannot create real preview account actions',()=>{const x=setup(),e=event('cdf-login-form');x.events.submit(e);assert.equal(e.prevented,true);x.events.DOMContentLoaded();assert.equal(x.nodes['cdf-google'].disabled,true);assert.equal(x.window.CDFPreview.accountActions,false);const f=event();f.target.closest=selector=>selector.includes('#cdf-google')?{}:null;x.events.click(f);assert.equal(f.stopped,true);});
test('out-of-preview links lead to an honest scope page while known routes stay available',()=>{for(const [route,blocked]of [['/pages/worlds.html',true],['/sanctuary',false]]){const x=setup(),e=event();e.target.closest=s=>s==='a[href]'?{href:'https://preview.test'+route}:null;x.events.click(e);assert.equal(!!e.prevented,blocked);if(blocked)assert.equal(x.location.href,'/preview-info.html');}});
