/* Real pinned Three geometry, substituted GPU renderer. Not a visual/device test. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),T=require(process.argv[2]);
assert.equal(T.REVISION,'128');const universe=require('../js/luvo_universe'),story=require('../js/cdf_intro_story');
const registry={window:{}};vm.runInNewContext(fs.readFileSync('js/world_registry.js','utf8'),registry);
const reports=[];
for(const width of [390,1280]){
 let rendered,disposedRenderer=false;const host={clientWidth:width,clientHeight:width===390?230:600,dataset:{},offsetWidth:width,appendChild(){}};
 const events={},toggle={setAttribute(){},addEventListener(){}},status={},narrative={hidden:false};
 const doc={hidden:false,documentElement:{lang:'de'},body:{dataset:{introScene:'first_step',introEnvironment:'roots'},classList:{add(){},remove(){}}},getElementById:id=>({'luvo-scene':host,'luvo-scene-toggle':toggle,'luvo-scene-status':status,'story-section':narrative,'story-count':{textContent:'4 / 6'}}[id]),querySelectorAll:()=>[],addEventListener(){}};
 const runtime={...T,WebGLRenderer:function(){this.domElement={setAttribute(){},addEventListener(){},removeEventListener(){},remove(){}};this.setClearColor=this.setPixelRatio=this.setSize=()=>{};this.render=(scene,camera)=>{rendered={scene,camera};};this.dispose=()=>{disposedRenderer=true;};}};
 const root={document:doc,innerWidth:width,innerHeight:800,devicePixelRatio:2,THREE:runtime,CDFIntroStory:story,CDFLuvoUniverse:universe,CDFWorlds:registry.window.CDFWorlds,CDFFloweeFairy:{sprite:()=>new T.Group()},matchMedia:()=>({matches:false,addEventListener(){}}),MutationObserver:class{observe(){}disconnect(){}},addEventListener:(k,f)=>events[k]=f,setTimeout:()=>1,clearTimeout(){},requestAnimationFrame:()=>1,cancelAnimationFrame(){},performance:{now:()=>0}};
 vm.runInNewContext(fs.readFileSync('js/luvo_scene.js','utf8'),{window:root});
 assert.equal(host.dataset.ready,'true');assert.ok(rendered.scene.getObjectByName('cdf-lantern'));let meshes=0,triangles=0;const designs=new Set();let baseRings=0;
 rendered.scene.traverse(o=>{if(o.userData.silhouette)designs.add(o.userData.silhouette);if(o.name==='world-base-ring'){baseRings++;assert.equal(o.rotation.x,1.25);assert.ok(o.position.y>0);}if(!o.isMesh)return;meshes++;for(const value of o.geometry.attributes.position.array)assert.ok(Number.isFinite(value));triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;});
 assert.equal(baseRings,registry.window.CDFWorlds.worlds.length);assert.equal(designs.size,5);assert.ok(meshes<450);assert.ok(triangles<100000);assert.ok(Number.isFinite(rendered.camera.aspect));root.CDFLuvoScene.dispose();assert.equal(disposedRenderer,true);
 reports.push({width,meshes,triangles,distinctSilhouettes:designs.size,lanternGeometry:true,inclinedBaseRings:baseRings,finiteGeometry:true,rendererDisposed:true,visualTest:false});
}
console.log(JSON.stringify(reports,null,2));
