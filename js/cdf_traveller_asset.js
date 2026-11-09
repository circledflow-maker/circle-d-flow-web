/* Shared, local Blender asset. Presentation only; no identity, reward or account state. */
(function(root){'use strict';
 const doc=root.document;let loaderPromise;
 function dispose(object){const owned=new Set();object?.traverse(o=>{if(o.geometry)owned.add(o.geometry);for(const m of (Array.isArray(o.material)?o.material:[o.material]).filter(Boolean)){owned.add(m);for(const v of Object.values(m))if(v?.isTexture)owned.add(v);}});for(const item of owned)item.dispose();}
 function ensure(T){if(T.REVISION!=='128')return Promise.reject(Error('Unsupported renderer'));if(T.GLTFLoader)return Promise.resolve();if(loaderPromise)return loaderPromise;
  loaderPromise=new Promise((resolve,reject)=>{const script=doc.createElement('script');script.src='/js/vendor/GLTFLoader-r128.js';let settled=false;
   const finish=error=>{if(settled)return;settled=true;root.clearTimeout(timer);script.onload=script.onerror=null;if(error){script.remove();reject(error);}else resolve();};
   const timer=root.setTimeout(()=>finish(Error('Character loader timed out')),10000);script.onload=()=>finish(T.GLTFLoader?null:Error('Character loader unavailable'));script.onerror=()=>finish(Error('Character loader unavailable'));doc.head.append(script);
  });return loaderPromise;
 }
 async function load(T,signal){await ensure(T);if(signal.aborted)throw Error('Character cancelled');const response=await root.fetch('/assets/models/cdf-traveller66.glb',{signal,credentials:'omit'});if(!response.ok)throw Error('Character unavailable');const bytes=await response.arrayBuffer();if(bytes.byteLength>2*1024*1024)throw Error('Character exceeds asset budget');
  return new Promise((resolve,reject)=>new T.GLTFLoader().parse(bytes,'',gltf=>resolve(gltf.scene),reject));
 }
 function mount(T,parent,{height=2.5,y=0,rotation=0,current=()=>true,onState=()=>{}}={}){let closed=false,instance;const controller=new root.AbortController();onState('loading');
  load(T,controller.signal).then(model=>{if(closed||!current()){dispose(model);return;}const bounds=new T.Box3().setFromObject(model),size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3());
   if(!Number.isFinite(size.y)||size.y<=0){dispose(model);throw Error('Invalid character geometry');}
   const scale=height/size.y;model.scale.multiplyScalar(scale);model.position.set(-center.x*scale,-bounds.min.y*scale,-center.z*scale);
   instance=new T.Group();instance.name='cdf-blender-traveller';instance.position.y=y;instance.rotation.y=rotation;instance.add(model);
   const old=Array.from(parent.children);parent.add(instance);for(const node of old){parent.remove(node);dispose(node);}parent.userData.cdfTraveller='blender66';onState('ready');
  }).catch(()=>{if(!closed)onState('fallback');});
  return()=>{if(closed)return;closed=true;controller.abort();if(instance){instance.parent?.remove(instance);dispose(instance);instance=null;}};
 }
 const api=Object.freeze({mount,dispose});if(typeof module==='object'&&module.exports)module.exports=api;root.CDFTravellerAsset=api;
})(typeof window==='object'?window:globalThis);
