const test=require('node:test'),assert=require('node:assert/strict'),{swipe,gesture,viewportFrame,bubblePosition}=require('../js/cdf_scene_dialogue.js'),fairy=require('../js/flowee_fairy.js');
test('swipe requires deliberate horizontal single pointer navigation',()=>{assert.equal(swipe({dx:-110,dy:10,elapsed:200}),'next');assert.equal(swipe({dx:90,dy:0}),'back');for(const x of [{dx:10,dy:0},{dx:80,dy:90},{dx:-100,dy:0,interactive:true},{dx:-100,dy:0,pointers:2},{dx:-100,dy:0,elapsed:1000}])assert.equal(swipe(x),null);});
test('Flowee colour accepts only a hex colour, keeps one silhouette and grants no identity',()=>{assert.equal(fairy.color('admin'),'#12efc9');assert.equal(fairy.color('#8855ff'),'#8855ff');const mint=fairy.svg(),violet=fairy.svg({color:'#8855ff'});assert.equal((mint.match(/class="fairy-wing"/g)||[]).length,4);assert.equal((violet.match(/class="fairy-wing"/g)||[]).length,4);assert.ok(!fairy.svg({color:'"><script>'}).includes('<script>'));});

test('actual pointer sequence accepts touch and left mouse drags, rejects cancel and multiple fingers',()=>{
 const down=(type,id=1,x=200)=>({pointerType:type,pointerId:id,button:0,isPrimary:id===1,clientX:x,clientY:100,timeStamp:0});
 const up=(id=1)=>({pointerId:id,clientX:80,clientY:105,timeStamp:300});
 for(const type of ['touch','pen','mouse']){const g=gesture();g.down(down(type));assert.equal(g.up(up()),'next');}
 const g=gesture();g.down(down('touch'));g.down(down('touch',2));assert.equal(g.up(up(2)),null);assert.equal(g.up(up()),null);
 g.down(down('touch'));g.cancel();assert.equal(g.up(up()),null);
 g.down(down('mouse'),true);assert.equal(g.up(up()),null);
});

test('answer overlays never reduce the scene frame; projected speech stays inside available space',()=>{
 assert.deepEqual(viewportFrame(390,844),{left:0,top:0,width:390,height:844});
 for(const x of [45,300]){const p=bubblePosition({x,y:300,width:390,height:844,top:120,bottom:470,bubbleWidth:240,bubbleHeight:90});assert.ok(p.left>=12&&p.left+240<=378);assert.ok(p.top>=120&&p.top+90<=458);assert.equal(p.tail,x>195?'right':'left');}
});

test('cinematic welcome and narration need no answer sheet, real choices and forms do',()=>{
 const {interactionMode}=require('../js/cdf_scene_dialogue.js');
 for(const mode of ['register','login','outcome'])assert.equal(interactionMode({mode}),true);
 for(const beat of ['many_worlds','first_step','return_path','threshold'])assert.equal(interactionMode({mode:'story',beat}),true);
 for(const x of [{mode:'welcome'},{mode:'story',beat:'city_light'},{mode:'story',beat:'flowee_lantern'},{mode:'unknown'}])assert.equal(interactionMode(x),false);
});

test('speech leaves a clear 42px radius around Flowee at all supported sides',()=>{
 const {bubblePosition,fairyTarget,speechPages}=require('../js/cdf_scene_dialogue.js');
 for(const [width,height]of [[360,640],[390,844],[844,390],[1280,800]])for(const beat of ['city_light','flowee_lantern','many_worlds','first_step']){
  const point=fairyTarget({width,height,top:130,bottom:height*.7,mode:'story',beat});const b=bubblePosition({...point,top:130,bottom:height*.7,bubbleWidth:230,bubbleHeight:140});
  assert.ok(b.left>=12&&b.left+b.width<=width-12+.01);assert.ok(b.left+b.width<=point.x-42+.01||b.left>=point.x+42-.01);
 }
 const body='Flowee begleitet dich auf deinem Weg. Du kannst dir die Welt in Ruhe ansehen und die Sprechblase jederzeit wieder öffnen.';
 const pages=speechPages(body,60);assert.ok(pages.length>1);assert.equal(pages.join(' '),body);assert.ok(pages.every(x=>x.length<=60));
});
