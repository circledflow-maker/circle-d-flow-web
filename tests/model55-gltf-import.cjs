/* Real Three r128 glTF parse. No browser, GPU, FPS or device claim. */
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const T=require(process.argv[2]);assert.equal(T.REVISION,'128');
vm.runInNewContext(fs.readFileSync(process.argv[3],'utf8'),{THREE:T,console,TextDecoder,TextEncoder,URL,Blob,self:globalThis});
const bytes=fs.readFileSync(process.argv[4]);
new T.GLTFLoader().parse(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'',gltf=>{
 let meshes=0,triangles=0,primitives=0,transparent=0;const materials=new Set(),geometries=new Set();
 gltf.scene.updateMatrixWorld(true);gltf.scene.traverse(o=>{if(!o.isMesh)return;meshes++;geometries.add(o.geometry);for(const n of o.geometry.attributes.position.array)assert.ok(Number.isFinite(n));triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;const list=Array.isArray(o.material)?o.material:[o.material];primitives+=list.length;for(const m of list){materials.add(m);assert.ok(m.isMeshStandardMaterial);if(m.transparent)transparent++;}});
 const bounds=new T.Box3().setFromObject(gltf.scene);assert.ok(!bounds.isEmpty());for(const n of [...bounds.min.toArray(),...bounds.max.toArray()])assert.ok(Number.isFinite(n));
 assert.ok(triangles>0&&triangles<=25000);assert.ok(primitives<=20);for(const g of geometries)g.dispose();for(const m of materials)m.dispose();
 console.log(JSON.stringify({three:T.REVISION,meshes,triangles,primitives,materials:materials.size,transparentMeshes:transparent,bounds:{min:bounds.min.toArray(),max:bounds.max.toArray()},finite:true,disposeCalled:true,browserVisual:'NOT_RUN'}));
},error=>{console.error(error);process.exitCode=1;});
