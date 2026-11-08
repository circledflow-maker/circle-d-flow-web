/* Original procedural LUVO scenery. Presentation only: no identity, reward or account writes. */
(function(root){'use strict';
 const doc=root.document,host=doc.getElementById('luvo-scene');if(!host)return;
 const media=root.matchMedia('(prefers-reduced-motion: reduce)'),toggle=doc.getElementById('luvo-scene-toggle'),status=doc.getElementById('luvo-scene-status');
 let renderer,scene,camera,world,fairy,ring,frame=0,epoch=0,stopped=false,paused=false,loading=false,disposed=false,timer,script,pulseTimer;
 const geometries=new Set(),materials=new Set(),textures=new Set();let particles,universe,lastTime=0,lantern,lanternGlow,pathLights=[],fairyPoint;
 const words={en:{start:'Opening LUVO…',ready:'LUVO · your first light',fallback:'Quiet view · your journey is ready',quiet:'Quiet view',open:'Open 3D',link:'Connecting your account…'},de:{start:'LUVO öffnet sich…',ready:'LUVO · dein erstes Licht',fallback:'Ruhige Ansicht · dein Einstieg ist bereit',quiet:'Ruhige Ansicht',open:'3D öffnen',link:'Dein Konto wird verbunden…'},pt:{start:'A abrir LUVO…',ready:'LUVO · a tua primeira luz',fallback:'Vista tranquila · podes começar',quiet:'Vista tranquila',open:'Abrir 3D',link:'A ligar a tua conta…'}};
 function stage(){
 const phase=doc.body.dataset.journeyScene||'welcome',sections=Array.from(doc.querySelectorAll?.('[data-journey-step]')||[]);
 const story=doc.getElementById('story-section'),login=doc.getElementById('login-section');
 const chapter=Number((doc.getElementById('story-count')?.textContent||'').match(/\d+/)?.[0]||1)-1;
 const mode=['ready','pending'].includes(phase)?phase:story&&!story.hidden?'story':login&&!login.hidden?'login':phase;
 const narrative=story&&!story.hidden?root.CDFIntroStory?.scene(doc.body.dataset.introScene):null;
 const selectedEnvironment=narrative&&['horizon','shelter','roots','tides'].includes(doc.body.dataset.introEnvironment)?doc.body.dataset.introEnvironment:narrative?.environment;
 const id=selectedEnvironment||root.CDFLuvoUniverse?.resolveStage({mode,step:Math.max(0,sections.findIndex(n=>!n.hidden)),chapter})||'welcome';
 doc.body.dataset.luvoStage=id;universe?.setStage(id);
 const beat=doc.body.dataset.introScene,lit=['return_path','threshold'].includes(beat);host.dataset.lanternState=lit?'lit':'waiting';
 if(lantern)lantern.visible=!!narrative;if(lanternGlow)lanternGlow.emissiveIntensity=lit?1.4:.55;
 pathLights.forEach((material,i)=>{material.emissiveIntensity=(lit?.8:.12)+i*.04;});
 const label=doc.getElementById('luvo-world-label');
 if(label){const names={welcome:'ORBIT · KINGDOM OF HEARTS',story:'ARCHIVE · CIRCLE D FLOW',roots:'SANCTUARY · ROOTS',tides:'CONNECTION · TIDES',shelter:'ARCHIVE · SHELTER',horizon:'HEART · HORIZON',login:'ATLAS · RETURN',pending:'CONNECTION · CROSSING',ready:'SANCTUARY · ARRIVAL'};label.textContent=names[id]||names.welcome;}
 }
 function copy(){stage();doc.body.dataset.floweeRender=renderer&&fairy?.isSprite&&!paused&&!media.matches?'scene':'fallback';const w=words[doc.documentElement.lang]||words.en;toggle.textContent=media.matches?w.quiet:paused?w.open:w.quiet;toggle.disabled=media.matches;doc.body.dataset.luvoLoading=String(loading);toggle.setAttribute('aria-pressed',String(!paused&&!media.matches));status.textContent=doc.body.dataset.accountConnecting==='true'?w.link:loading?w.start:renderer?w.ready:w.fallback;}
 function halt(){if(frame)root.cancelAnimationFrame(frame);frame=0;}
 function release(){halt();universe?.dispose();universe=null;if(renderer){renderer.domElement.removeEventListener('webglcontextlost',lost);renderer.dispose();renderer.domElement.remove();}for(const g of geometries)g.dispose();for(const m of materials)m.dispose();for(const t of textures)t.dispose();textures.clear();geometries.clear();materials.clear();renderer=scene=camera=world=fairy=ring=particles=lantern=lanternGlow=null;pathLights=[];host.dataset.ready='false';}
 function lost(event){event.preventDefault();epoch++;loading=false;release();copy();}
 function size(){if(!renderer)return;halt();const width=host.clientWidth||root.innerWidth,height=host.clientHeight||root.innerHeight;renderer.setPixelRatio(Math.min(root.devicePixelRatio||1,width<700?1.25:1.75));renderer.setSize(width,height);camera.aspect=width/height;camera.position.set(width<700?0:3.8,width<700?4.8:4.2,width<700?(root.CDFLuvoUniverse?.fitMobileDistance(width,height)||11.5):15);camera.lookAt(width<700?0:1,3.3,0);camera.updateProjectionMatrix();world.position.set(width<700?0:-2.6,width<700?1.9:0,0);world.scale.setScalar(width<700?.9:1);draw(0);}
 function draw(time){if(!renderer)return;const t=time*.001,dt=lastTime?Math.min(.05,Math.max(0,(time-lastTime)*.001)):.016;lastTime=time;const active=!paused&&!media.matches&&!doc.hidden&&!stopped;
  if(active){world.rotation.y=Math.sin(t*.12)*.07;const welcome=doc.body.dataset.dialogMode==='welcome',mobile=(host.clientWidth||root.innerWidth)<700;fairy.position.set(welcome?(mobile?3.8:8):2,(welcome?6.5:4.2)+Math.sin(t*1.4)*.12,welcome?.6:1.3);fairy.rotation.y=t*.28;ring.rotation.z=Math.sin(t*.12)*.04;particles.rotation.y=t*.008;universe?.update(t,dt,host.clientWidth||root.innerWidth,host.clientHeight||root.innerHeight);}
  renderer.render(scene,camera);
  if(fairyPoint&&root.CDFSceneDialogue?.anchor){fairy.getWorldPosition(fairyPoint);fairyPoint.project(camera);const width=host.clientWidth||root.innerWidth,height=host.clientHeight||root.innerHeight;if(Number.isFinite(fairyPoint.x)&&Number.isFinite(fairyPoint.y))root.CDFSceneDialogue.anchor({x:(fairyPoint.x*.5+.5)*width,y:(-.5*fairyPoint.y+.5)*height,width,height});}
  frame=active?root.requestAnimationFrame(draw):0;
 }
 function resume(){halt();if(renderer)draw(root.performance.now());}
 function build(T,run){if(disposed||run!==epoch||paused||media.matches)return;try{
  renderer=new T.WebGLRenderer({alpha:true,antialias:root.innerWidth>700,powerPreference:'high-performance'});renderer.setClearColor(0x061014,0);renderer.outputEncoding=T.sRGBEncoding;host.appendChild(renderer.domElement);renderer.domElement.setAttribute('aria-hidden','true');renderer.domElement.addEventListener('webglcontextlost',lost);
  scene=new T.Scene();scene.fog=new T.FogExp2(0x07171d,.012);camera=new T.PerspectiveCamera(45,1,.1,100);world=new T.Group();scene.add(world);
  scene.add(new T.HemisphereLight(0xdff6e8,0x09212c,1));const sun=new T.DirectionalLight(0xffd7a1,1.4);sun.position.set(-4,9,7);scene.add(sun);
  const mat=(color,emissive=0)=>{const m=new T.MeshStandardMaterial({color,emissive,emissiveIntensity:.45,roughness:.75,metalness:.18,flatShading:true});materials.add(m);return m;};
  const bark=mat(0x715038),foliage=mat(0x648a69),gold=mat(0xc6ac75,0x151006),stone=mat(0x1b4445),mint=mat(0x96eed2,0x267c68),dark=mat(0x0f2c34);
  function mesh(g,m,parent=world){geometries.add(g);const o=new T.Mesh(g,m);parent.add(o);return o;}
  const island=mesh(new T.CylinderGeometry(5.2,2.2,2.2,7),stone);island.position.y=-1.7;
  const terrace=mesh(new T.CylinderGeometry(5.4,5.2,.35,48),dark);terrace.position.y=-.45;
  ring=new T.Group();world.add(ring);ring.position.set(0,3.5,-1.3);
  mesh(new T.TorusGeometry(3.25,.085,8,96),gold,ring);
  const inner=mesh(new T.TorusGeometry(2.98,.025,6,96),mint,ring);inner.rotation.z=.3;
  for(let i=0;i<12;i++){const angle=i*Math.PI/6,o=mesh(new T.OctahedronGeometry(.1),gold,ring);o.position.set(Math.cos(angle)*3.25,Math.sin(angle)*3.25,0);}
  function branch(a,b,r){const start=new T.Vector3(...a),end=new T.Vector3(...b),delta=end.clone().sub(start);const o=mesh(new T.CylinderGeometry(r*.55,r,delta.length(),10),bark);o.position.copy(start.add(end).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());}
  branch([0,-.3,0],[0,3.8,0],.18);
  for(let i=0;i<8;i++){const angle=i*2.4,y=1.1+i*.32,x=Math.cos(angle)*(1.1+i*.07),z=Math.sin(angle)*.7;
   branch([0,y,0],[x,y+1,z],.07);branch([x,y+1,z],[x*1.3,y+1.4,z+.25],.035);
   const leaf=mesh(new T.IcosahedronGeometry(.52,2),foliage);leaf.position.set(x*1.25,y+1.3,z);leaf.scale.set(1,.65,.8);
   for(const side of [-1,1]){const cluster=mesh(new T.IcosahedronGeometry(.35,1),foliage);cluster.position.set(x*1.25+side*.3,y+1.4,z+.15);cluster.scale.set(.9,.6,.9);}
  }
  for(let i=0;i<7;i++){const light=mat(i%2?0xd5b96f:0x254c4b,0x6b4115);pathLights.push(light);const o=mesh(new T.BoxGeometry(1.15,.09,.85),light);o.position.set(Math.sin(i*.35)*.25,-.1,1.4+i*1.1);o.rotation.y=Math.sin(i*.4)*.1;}
  // Original CDF lantern: handle, cap, four frame bars and a warm light core.
  lantern=new T.Group();lantern.name='cdf-lantern';world.add(lantern);lantern.position.set(1.25,.7,2.7);lantern.scale.setScalar(1.25);
  const lanternBase=mesh(new T.CylinderGeometry(.32,.36,.13,8),gold,lantern);lanternBase.position.y=-.3;
  const lanternCap=mesh(new T.ConeGeometry(.36,.24,8),gold,lantern);lanternCap.position.y=.42;
  for(const x of [-.23,.23])for(const z of [-.23,.23]){const bar=mesh(new T.CylinderGeometry(.025,.025,.58,5),gold,lantern);bar.position.set(x,.04,z);}
  const handle=mesh(new T.TorusGeometry(.16,.035,6,20),gold,lantern);handle.position.y=.7;
  lanternGlow=mat(0xffd78d,0xffaa36);const heart=mesh(new T.SphereGeometry(.2,12,8),lanternGlow,lantern);heart.scale.set(.75,1.2,.75);heart.position.y=.06;
  const plinth=mesh(new T.CylinderGeometry(.58,.66,.22,8),stone);plinth.position.set(1.25,.14,2.7);
  fairy=root.CDFFloweeFairy?.sprite(T,{registerTexture:t=>textures.add(t),registerMaterial:m=>materials.add(m)})||new T.Group();world.add(fairy);fairy.position.set(2,4.2,1.3);fairyPoint=new T.Vector3();
  const positions=new Float32Array(72*3);for(let i=0;i<72;i++){positions[i*3]=Math.sin(i*12.98)*13;positions[i*3+1]=(i%19)*.58;positions[i*3+2]=Math.cos(i*7.23)*10-4;}
  const dust=new T.BufferGeometry();dust.setAttribute('position',new T.BufferAttribute(positions,3));geometries.add(dust);const dustMat=new T.PointsMaterial({color:0xe9d298,size:.045,transparent:true,opacity:.65});materials.add(dustMat);particles=new T.Points(dust,dustMat);scene.add(particles);
  universe=root.CDFLuvoUniverse?.build({T,scene,world,mesh,mat,gold,mint,stone,dark,camera,registerGeometry:g=>geometries.add(g),registerMaterial:m=>materials.add(m),registerTexture:t=>textures.add(t),worlds:root.CDFWorlds?.worlds||[]});stage();
  loading=false;host.dataset.ready='true';size();resume();copy();
 }catch{loading=false;release();copy();}}
 function start(){if(disposed||paused||media.matches||loading||renderer){copy();return;}const run=++epoch;loading=true;copy();
  if(root.THREE){build(root.THREE,run);return;}
  script=doc.createElement('script');script.src='https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';script.async=true;
  timer=root.setTimeout(()=>{if(run!==epoch)return;epoch++;loading=false;script?.remove();copy();},8000);
  script.onload=()=>{root.clearTimeout(timer);if(run===epoch)build(root.THREE,run);};script.onerror=()=>{root.clearTimeout(timer);if(run===epoch){loading=false;copy();}};doc.head.appendChild(script);
 }
 function pulse(){if(media.matches||doc.hidden)return;doc.body.classList.remove('luvo-cut');void host.offsetWidth;doc.body.classList.add('luvo-cut');root.clearTimeout(pulseTimer);pulseTimer=root.setTimeout(()=>doc.body.classList.remove('luvo-cut'),650);}
 toggle.addEventListener('click',()=>{paused=!paused;host.dataset.quiet=String(paused);if(paused){epoch++;loading=false;root.clearTimeout(timer);script?.remove();release();}else start();copy();});
 media.addEventListener?.('change',()=>{epoch++;loading=false;root.clearTimeout(timer);if(media.matches){script?.remove();release();}else if(!paused)start();copy();});
 doc.addEventListener('visibilitychange',resume);
 root.addEventListener('resize',size);root.addEventListener('cdf:scene-frame',size);root.addEventListener('pagehide',()=>{stopped=true;epoch++;loading=false;script?.remove();release();root.clearTimeout(timer);root.clearTimeout(pulseTimer);});root.addEventListener('pageshow',()=>{if(stopped){stopped=false;start();}});
 const observer=new root.MutationObserver(records=>{if(disposed)return;copy();if(records.some(r=>['data-journey-scene','data-intro-scene','data-intro-environment'].includes(r.attributeName)))pulse();});observer.observe(doc.body,{attributes:true,attributeFilter:['data-journey-scene','data-account-connecting','data-intro-scene','data-intro-environment']});
 const langObserver=new root.MutationObserver(copy);langObserver.observe(doc.documentElement,{attributes:true,attributeFilter:['lang']});
 root.CDFLuvoScene={dispose(){disposed=true;epoch++;root.clearTimeout(timer);root.clearTimeout(pulseTimer);observer.disconnect();langObserver.disconnect();release();},pulse};
 copy();start();
})(window);

