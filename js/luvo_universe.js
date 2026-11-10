/* Original CDF cinematic world. Stage input is UI mode/step only, never account data. */
(function(root){'use strict';
 const stages={
  welcome:{world:'orbit',theme:'cosmos',cam:[3.8,4.2,15],look:[1,3.3,0],hue:0x071322},
  story:{world:'archive',theme:'cosmos',cam:[-2,6,19],look:[0,2.5,-2],hue:0x17152d},
  roots:{world:'sanctuary',theme:'roots',cam:[-3.5,3.6,14],look:[0,2.7,0],hue:0x0a2425},
  tides:{world:'connection',theme:'tides',cam:[4.5,3,15],look:[0,2.2,0],hue:0x102c41},
  shelter:{world:'archive',theme:'shelter',cam:[-3,4.5,15],look:[0,2.8,-1],hue:0x251c32},
  horizon:{world:'heart',theme:'horizon',cam:[2.6,5.2,17],look:[0,2.2,-1],hue:0x40302b},
  login:{world:'atlas',theme:'tides',cam:[3.8,3.4,14],look:[0,2.7,0],hue:0x13243d},
  pending:{world:'connection',theme:'tides',cam:[1,4,17],look:[0,2.5,0],hue:0x142c37},
  ready:{world:'sanctuary',theme:'horizon',cam:[0,4,13],look:[0,3,0],hue:0x31362c}
 };
 function fitMobileDistance(width,height,base=11.5){const aspect=Math.max(.25,(Number(width)||1)/Math.max(1,Number(height)||1));return Math.max(Number.isFinite(base)?base:11.5,11.8/(2*Math.tan(Math.PI/8)*aspect));}
 function resolveStage({mode='welcome',step=0,chapter=0}={}){
  if(mode==='step'||mode==='register')return ['roots','tides','shelter','horizon'][Number.isInteger(step)&&step>=0&&step<4?step:0];
  if(mode==='story')return ['story','roots','horizon'][Number.isInteger(chapter)&&chapter>=0&&chapter<3?chapter:0];
  return Object.hasOwn(stages,mode)?mode:'welcome';
 }
 function build({T,scene,world,mesh,mat,gold,mint,stone,dark,camera,registerGeometry,registerMaterial,registerTexture=()=>{},worlds=[]}){
  const far=new T.Group();scene.add(far);const themes={};let goal='welcome',current='welcome';const focus=new T.Vector3(1,3.3,0),targetCamera=new T.Vector3(),targetLook=new T.Vector3(),fogColor=new T.Color(stages.welcome.hue);
  const fogGoals=Object.fromEntries(Object.entries(stages).map(([key,spec])=>[key,new T.Color(spec.hue)]));const seaGoals={horizon:new T.Color(0x486c70),tides:new T.Color(0x285d78),other:new T.Color(0x193849)};
  const copper=mat(0xb77c50),terracotta=mat(0x9d5d43),ivory=mat(0xe6d7b6),leaf=mat(0x327767),deep=mat(0x163b50),sand=mat(0xc7aa78);
  const seaMaterial=new T.MeshPhongMaterial({color:0x214a67,transparent:true,opacity:.72,shininess:80,side:T.DoubleSide});registerMaterial(seaMaterial);
  const sea=mesh(new T.PlaneGeometry(180,180,1,1),seaMaterial,scene);sea.rotation.x=-Math.PI/2;sea.position.set(0,-5.1,-20);
  // Original procedural lunar surface and schematic sky, not a date/location planetarium.
  const textureSize=128,pixels=new Uint8Array(textureSize*textureSize*4);
  const craters=Array.from({length:22},(_,i)=>({x:(i*.61803398875%1)*128,y:(Math.sin(i*12.3)*.5+.5)*128,r:3+i%9}));
  for(let y=0;y<textureSize;y++)for(let x=0;x<textureSize;x++){let value=181+19*Math.sin(x*.073+Math.sin(y*.12))*Math.cos(y*.058)+7*Math.sin(x*1.7+y*2.9);
   for(const c of craters){const d=Math.hypot(x-c.x,y-c.y)/c.r;if(d<1)value-=20*(1-d);else if(d<1.15)value+=9;}
   const p=(y*128+x)*4;pixels[p]=value;pixels[p+1]=value*.98;pixels[p+2]=value*.93;pixels[p+3]=255;
  }
  const moonTexture=new T.DataTexture(pixels,128,128,T.RGBAFormat);moonTexture.needsUpdate=true;moonTexture.magFilter=T.LinearFilter;moonTexture.minFilter=T.LinearFilter;registerTexture(moonTexture);
  const moonMaterial=new T.MeshStandardMaterial({map:moonTexture,color:0xd9d8d0,roughness:1,metalness:0,flatShading:false});registerMaterial(moonMaterial);
  const moon=mesh(new T.SphereGeometry(2.2,64,32),moonMaterial,far);moon.name='cdf-moon';moon.position.set(-12,17,-40);
  let seed=5317;const random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
  for(const [count,size,opacity]of [[900,.065,.7],[140,.13,.95]]){const points=new Float32Array(count*3);for(let i=0;i<count;i++){points[i*3]=(random()-.5)*130;points[i*3+1]=2+random()*56;points[i*3+2]=-36-random()*15;}
   const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.BufferAttribute(points,3));registerGeometry(geometry);const material=new T.PointsMaterial({color:0xe3e8f5,size,transparent:true,opacity,depthWrite:false,fog:false});registerMaterial(material);const stars=new T.Points(geometry,material);stars.name='cdf-starfield';far.add(stars);
  }
  const patterns=[
   {name:'Orion',x:12,y:18,points:[[-2,3],[2,3.5],[1,0],[0,0],[-1,-.1],[-2,-4],[2,-4]],edges:[[0,1],[1,2],[2,3],[3,4],[4,0],[4,5],[2,6],[5,6]]},
   {name:'Big Dipper asterism',x:-19,y:25,points:[[-4,1],[-2,1.5],[0,.7],[1,0],[4,.4],[3,-2],[.5,-2]],edges:[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,3]]}
  ];
  for(const pattern of patterns){const positions=pattern.points.map(([x,y])=>new T.Vector3(x+pattern.x,y+pattern.y,-42)),lines=pattern.edges.flatMap(([a,b])=>[positions[a],positions[b]]);
   const geometry=new T.BufferGeometry().setFromPoints(lines);registerGeometry(geometry);const material=new T.LineBasicMaterial({color:0x9aafce,transparent:true,opacity:.21,depthWrite:false,fog:false});registerMaterial(material);const constellation=new T.LineSegments(geometry,material);constellation.name='cdf-schematic-'+pattern.name;far.add(constellation);
   const dotsGeometry=new T.BufferGeometry().setFromPoints(positions);registerGeometry(dotsGeometry);const dotsMaterial=new T.PointsMaterial({color:0xf0e9d8,size:.19,transparent:true,opacity:.95,fog:false});registerMaterial(dotsMaterial);far.add(new T.Points(dotsGeometry,dotsMaterial));
  }
  const worldList=worlds.length?worlds.map(w=>({id:w.id,accent:w.accent})):[{id:'sanctuary',accent:'#d4af37'},{id:'sound',accent:'#c499ef'},{id:'heart',accent:'#ef9eb7'},{id:'atlas',accent:'#7edbc7'}];
  worldList.forEach((entry,i)=>{
   const island=new T.Group();far.add(island);const angle=i*2.399,size=.8+(i%3)*.3;island.position.set(Math.cos(angle)*(10+i*.5),1+(i%5)*1.4,-12-i*1.3);island.userData.worldId=entry.id;
   const rock=mesh(new T.CylinderGeometry(size,size*.22,size*1.6,6),stone,island);rock.position.y=-size*.6;
   const top=mesh(new T.CylinderGeometry(size*1.03,size,.14,24),leaf,island);
   island.userData.silhouette=['arcade','terraces','spire','grove','sail'][i%5];
   const portal=mesh(new T.TorusGeometry(size*.56,.035,6,40),mat(entry.accent),island);portal.rotation.x=1.25;portal.position.y=size*.35;portal.name='world-base-ring';
   // Independent CDF silhouettes; these shapes are not assigned to a culture or deity.
   switch(i%5){
    case 0:{for(const x of [-.55,.2]){const post=mesh(new T.CylinderGeometry(.1,.14,.75,6),ivory,island);post.position.set(x,.45,-.12);}const arch=mesh(new T.TorusGeometry(.45,.09,6,20,Math.PI),copper,island);arch.position.set(-.175,.82,-.12);
     const crown=mesh(new T.IcosahedronGeometry(.38,1),leaf,island);crown.position.set(.58,.96,-.12);crown.scale.set(.85,1.3,.85);
     const water=mesh(new T.CylinderGeometry(.3,.34,.07,8),mint,island);water.position.set(-.15,.16,.28);
     const step=mesh(new T.BoxGeometry(.65,.08,.24),sand,island);step.position.set(-.175,.12,.48);break;}
    case 1:{for(let j=0;j<3;j++){const terrace=mesh(new T.CylinderGeometry(.7-j*.16,.73-j*.16,.24,6),j%2?copper:terracotta,island);terrace.position.set(0,.18+j*.24,.14-j*.18);}
     const stair=mesh(new T.BoxGeometry(.22,.36,.4),sand,island);stair.position.set(0,.28,.48);
     const roof=mesh(new T.BoxGeometry(.76,.1,.38),copper,island);roof.position.set(0,.94,-.22);
     for(const side of [-1,1]){const shrub=mesh(new T.IcosahedronGeometry(.2,1),leaf,island);shrub.position.set(side*.52,.38,.04);}break;}
    case 2:{const tower=mesh(new T.CylinderGeometry(.2,.37,1.1,7),ivory,island);tower.position.y=.6;const roof=mesh(new T.ConeGeometry(.48,.65,7),copper,island);roof.position.y=1.45;const balcony=mesh(new T.TorusGeometry(.4,.055,5,16),gold,island);balcony.rotation.x=Math.PI/2;balcony.position.y=.9;break;}
    case 3:{for(let j=0;j<3;j++){const x=[-.34,.34,.05][j],z=[-.22,.08,-.18][j],height=[1.22,.88,.72][j],trunk=mesh(new T.CylinderGeometry(.045,.09,height*.7,5),copper,island);trunk.position.set(x,height*.35,z);const crown=mesh(new T.IcosahedronGeometry(.35,1),j===1?mint:leaf,island);crown.position.set(x,height,z);crown.scale.set(j===0?1.05:.85,j===0?1.45:1,.8);}
     const threshold=mesh(new T.BoxGeometry(.85,.1,.18),terracotta,island);threshold.position.set(0,.38,.4);break;}
    case 4:{const deck=mesh(new T.BoxGeometry(1.1,.12,.4),copper,island);deck.position.y=.18;const mast=mesh(new T.CylinderGeometry(.035,.04,1.2,5),gold,island);mast.position.y=.8;const sail=mesh(new T.ConeGeometry(.5,.95,3,1,true),ivory,island);sail.position.set(.15,.85,0);sail.rotation.z=-.2;break;}
   }
  });
  function theme(id){const group=new T.Group();world.add(group);themes[id]=group;return group;}
  const roots=theme('roots');
  for(let i=0;i<6;i++){const angle=i*Math.PI/3,x=Math.cos(angle)*3.5,z=Math.sin(angle)*2.8;const trunk=mesh(new T.CylinderGeometry(.14,.3,1.6,7),copper,roots);trunk.position.set(x,.8,z);const crown=mesh(new T.IcosahedronGeometry(.75,1),leaf,roots);crown.scale.set(i%2?1.25:.8,i%2?.8:1.35,1);crown.position.set(x,1.9,z);
   for(let j=0;j<3;j++){const shoot=mesh(new T.IcosahedronGeometry(.4,1),leaf,roots);shoot.position.set(x+Math.cos(j*2.1)*.55,1.6+(j%2)*.35,z+Math.sin(j*2.1)*.45);shoot.scale.set(1,.55,1);}
  }
  const rootsRing=mesh(new T.TorusGeometry(4.5,.08,6,60),mint,roots);rootsRing.rotation.x=Math.PI/2;rootsRing.position.y=-.15;
  const tides=theme('tides');
  for(const x of [-3.2,3.2]){const dock=mesh(new T.BoxGeometry(1.1,.2,7),copper,tides);dock.position.set(x,-.1,1);for(let i=0;i<4;i++){const post=mesh(new T.CylinderGeometry(.08,.11,.9,6),gold,tides);post.position.set(x,.3,-1.5+i*1.5);}}
  const boat=mesh(new T.SphereGeometry(1,12,8),terracotta,tides);boat.scale.set(.55,.25,1.8);boat.position.set(-4.1,-.2,2);
  const mast=mesh(new T.CylinderGeometry(.035,.035,2.8,5),gold,tides);mast.position.set(-4.1,1,2);
  const sail=mesh(new T.PlaneGeometry(1.2,1.7),ivory,tides);sail.position.set(-3.6,1.5,2);sail.rotation.y=-.4;
  const shelter=theme('shelter');
  for(let i=0;i<6;i++){const angle=i*Math.PI/3,x=Math.cos(angle)*3.8,z=Math.sin(angle)*3.1;const column=mesh(new T.CylinderGeometry(.14,.19,2.7,8),sand,shelter);column.position.set(x,1.2,z);}
  const roof=mesh(new T.ConeGeometry(4.7,1,6,1,true),terracotta,shelter);roof.position.y=3.1;roof.rotation.y=Math.PI/6;
  const threshold=mesh(new T.TorusGeometry(3.7,.045,5,64),gold,shelter);threshold.rotation.x=Math.PI/2;threshold.position.y=.1;
  const horizon=theme('horizon');
  for(let i=0;i<8;i++){const x=-4+i*1.15,height=1.5+(i%3)*.6;const building=mesh(new T.BoxGeometry(.85,height,.85),i%2?ivory:terracotta,horizon);building.position.set(x,height/2,-3.2);const tileRoof=mesh(new T.ConeGeometry(.72,.55,4),copper,horizon);tileRoof.position.set(x,height+.2,-3.2);tileRoof.rotation.y=Math.PI/4;for(let j=0;j<2;j++){const window=mesh(new T.PlaneGeometry(.16,.3),mint,horizon);window.position.set(x+(j-.5)*.3,height*.65,-2.76);}
   const door=mesh(new T.BoxGeometry(.23,.46,.035),deep,horizon);door.position.set(x,.23,-2.75);
   const lintel=mesh(new T.TorusGeometry(.16,.035,5,12,Math.PI),sand,horizon);lintel.position.set(x,.46,-2.72);
   const step=mesh(new T.BoxGeometry(.4,.07,.22),sand,horizon);step.position.set(x,.035,-2.65);
  }
  for(let i=0;i<5;i++){const wave=mesh(new T.TorusGeometry(5+i*1.6,.025,4,80),mint,scene);wave.rotation.x=Math.PI/2;wave.position.set(0,-4.9,-3);wave.scale.y=.6;}
  function setStage(id,foreground=true){goal=Object.hasOwn(stages,id)?id:'welcome';for(const [themeId,group]of Object.entries(themes))group.visible=foreground&&themeId===stages[goal].theme;}
  function update(t,dt,width,height){
   const close=root.document?.body?.dataset.luvoFocus==='cabin',spec=close?{...stages[goal],cam:[-2.5,3.4,10],look:[-1.5,1.5,1]}:stages[goal],mobile=width<700,rate=Math.min(1,Math.max(0,dt)*2.8);targetCamera.set(...(mobile?(close?[-1.4,4.1,10]:[spec.cam[0]*.15,4.8,fitMobileDistance(width,height,Math.max(11,spec.cam[2]*.68))]):spec.cam));camera.position.lerp(targetCamera,rate);
   targetLook.set(...(mobile?(close?[-1.3,3,1]:[0,2.8,0]):spec.look));focus.lerp(targetLook,rate);camera.lookAt(focus);
   fogColor.lerp(fogGoals[goal],rate);scene.fog.color.copy(fogColor);seaMaterial.color.lerp(seaGoals[spec.theme]||seaGoals.other,rate);
   moon.position.x=mobile?-8:-17;moon.position.y=mobile?21:15;far.rotation.y=Math.sin(t*.035)*.008;boat.position.y=-.2+Math.sin(t*.65)*.045;current=goal;
  }
  setStage(goal);return{setStage,update,get stage(){return current;},dispose(){scene.remove(far);scene.remove(sea);}};
 }
 const api=Object.freeze({resolveStage,stages,build,fitMobileDistance});if(typeof module==='object'&&module.exports)module.exports=api;else root.CDFLuvoUniverse=api;
})(typeof window==='object'?window:globalThis);
