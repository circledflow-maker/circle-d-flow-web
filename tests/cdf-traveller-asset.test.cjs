'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const source=fs.readFileSync(require('node:path').join(__dirname,'../js/cdf_traveller_asset.js'),'utf8');
function setup(){let complete,disposed=0,states=[];const geometry={dispose(){disposed++;}},material={dispose(){disposed++;}};
 const node={scale:{multiplyScalar(){}},position:{set(){}},traverse(fn){fn({geometry,material});}};
 class Group{constructor(){this.children=[];this.userData={};this.position={y:0};this.rotation={y:0};}add(n){this.children.push(n);n.parent=this;}remove(n){this.children=this.children.filter(x=>x!==n);n.parent=null;}traverse(fn){for(const n of this.children)n.traverse?.(fn);}}
 const parent=new Group(),old={traverse(fn){fn({geometry:{dispose(){}},material:{dispose(){}}});}};parent.add(old);
 const T={REVISION:'128',Group,Vector3:class{},Box3:class{setFromObject(){this.min={y:0};return this;}getSize(){return{y:2};}getCenter(){return{x:0,z:0};}},GLTFLoader:class{parse(_a,_b,success){complete=()=>success({scene:node});}}};
 const root={AbortController,setTimeout,clearTimeout,fetch:async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(12)}),document:{}};
 vm.runInNewContext(source,{window:root,module:{exports:{}},Error});
 return{root,T,parent,old,node,states,get disposed(){return disposed;},complete(){complete();}};
}
const tick=()=>new Promise(resolve=>setImmediate(resolve));
test('late GLB parse cannot replace a disposed scene and frees its resources',async()=>{const x=setup();const stop=x.root.CDFTravellerAsset.mount(x.T,x.parent,{onState:s=>x.states.push(s)});await tick();stop();x.complete();await tick();assert.deepEqual(x.parent.children,[x.old]);assert.equal(x.disposed,2);assert.ok(!x.states.includes('ready'));});
test('successful mount replaces fallback once and repeated cleanup is harmless',async()=>{const x=setup();const stop=x.root.CDFTravellerAsset.mount(x.T,x.parent,{onState:s=>x.states.push(s)});await tick();x.complete();await tick();assert.equal(x.parent.children.length,1);assert.notEqual(x.parent.children[0],x.old);assert.equal(x.parent.userData.cdfTraveller,'blender66');stop();stop();assert.equal(x.parent.children.length,0);assert.equal(x.disposed,2);});
test('failed network preserves the usable fallback',async()=>{const x=setup();x.root.fetch=async()=>({ok:false});x.root.CDFTravellerAsset.mount(x.T,x.parent,{onState:s=>x.states.push(s)});await tick();assert.deepEqual(x.parent.children,[x.old]);assert.equal(x.states.at(-1),'fallback');});

test('stale target keeps fallback and disposes parsed character',async()=>{const x=setup();x.root.CDFTravellerAsset.mount(x.T,x.parent,{current:()=>false});await tick();x.complete();await tick();assert.deepEqual(x.parent.children,[x.old]);assert.equal(x.disposed,2);});
