/* Original code-native reference models. No account, reward or network access. */
(function(root){'use strict';
 function build(T,{mobile=false}={}){
  const navigator=new T.Group();navigator.name='navigator-soul';navigator.position.y=1.35;navigator.rotation.y=Math.PI;
  function toon(color){const m=new T.MeshToonMaterial({color});m.color.convertSRGBToLinear();return m;}
  const cloth=toon('#252430'),seam=toon('#b7d6c6'),voidMat=new T.MeshBasicMaterial({color:'#080b13'});
  function mesh(g,m,x,y,z,parent=navigator){const o=new T.Mesh(g,m);o.position.set(x,y,z);parent.add(o);return o;}
  function rod(a,b,r,m,parent=navigator){const start=new T.Vector3(...a),end=new T.Vector3(...b);const o=mesh(new T.CylinderGeometry(r,r,start.distanceTo(end),6),m,0,0,0,parent);o.position.copy(start).add(end).multiplyScalar(.5);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),end.sub(start).normalize());return o;}
  // Floating, faceless traveller: hood, flared dark coat, separate sleeves and mint seams. An original CDF traveller, without a franchise insignia.
  const coatProfile=[new T.Vector2(.92,-.9),new T.Vector2(.66,-.45),new T.Vector2(.4,.2),new T.Vector2(.3,.85),new T.Vector2(.26,1.1)];
  mesh(new T.LatheGeometry(coatProfile,mobile?12:20),cloth,0,0,0);
  const hood=mesh(new T.SphereGeometry(.37,16,12),cloth,0,1.28,0);hood.scale.set(1,1.4,.9);
  const opening=mesh(new T.CircleGeometry(.25,20),voidMat,0,1.26,-.35);opening.rotation.y=Math.PI;opening.scale.set(.87,1.35,1);
  rod([0,1.04,-.26],[0,.24,-.4],.018,seam);rod([0,.24,-.4],[0,-.87,-.93],.018,seam);
  [-1,1].forEach(side=>{rod([side*.27,.86,0],[side*.96,.14,-.02],.135,cloth);const glove=mesh(new T.SphereGeometry(.14,8,6),cloth,side*1.03,.07,-.02);glove.scale.set(1,.65,1);rod([0,-.85,-.94],[side*.52,-.95,-.76],.014,seam);for(let i=0;i<3;i++){const chain=mesh(new T.TorusGeometry(.055,.012,4,10),seam,side*(.91+i*.035),.08-i*.1,-.13);chain.rotation.y=i%2?Math.PI/2:0;}});
  const tails=[];for(const side of [-1,1]){const shape=new T.Shape();shape.moveTo(0,0);shape.lineTo(side*.55,-.72);shape.lineTo(side*.75,-1.02);shape.lineTo(side*.2,-.85);const tail=mesh(new T.ShapeGeometry(shape),new T.MeshToonMaterial({color:'#292733',side:T.DoubleSide}),side*.25,-.18,.28);tails.push(tail);}
  // A small CDF soul spark makes the hooded traveller readable from above.
 const soulSpark=mesh(new T.SphereGeometry(.075,8,6),new T.MeshBasicMaterial({color:'#a4ead6',toneMapped:false}),0,1.25,-.37);soulSpark.name='navigator-soul-spark';
 navigator.scale.setScalar(.86);
  const flowee=new T.Group();flowee.name='flowee-reference';
  const leafMat=new T.MeshBasicMaterial({color:'#00cfad',toneMapped:false}),coreMat=new T.MeshBasicMaterial({color:'#00ffe0',toneMapped:false});leafMat.color.convertSRGBToLinear();coreMat.color.convertSRGBToLinear();
  const leafShape=new T.Shape();leafShape.moveTo(0,.24);leafShape.bezierCurveTo(-.35,.3,-.33,-.12,0,-.34);leafShape.bezierCurveTo(.33,-.12,.3,.25,0,.24);
  const leafGeo=new T.ExtrudeGeometry(leafShape,{depth:.1,bevelEnabled:true,bevelThickness:.035,bevelSize:.025,bevelSegments:2,steps:1});
  for(const side of [-1,1]){const leaf=mesh(leafGeo,leafMat,side*.3,-.02,-.04,flowee);leaf.rotation.z=side*.35;leaf.name=side<0?'flowee-left':'flowee-right';}
  const core=mesh(new T.SphereGeometry(.245,20,14),coreMat,0,.19,.09,flowee);core.name='flowee-core';core.scale.z=.62;
  // A generated radial texture gives a soft mint glow without a downloaded bitmap.
  const pixels=new Uint8Array(32*32*4);for(let y=0;y<32;y++)for(let x=0;x<32;x++){const i=(y*32+x)*4,r=Math.hypot((x-15.5)/15.5,(y-15.5)/15.5);pixels.set([0,255,217,Math.round(Math.max(0,1-r)**3*150)],i);}
  const texture=new T.DataTexture(pixels,32,32,T.RGBAFormat);texture.needsUpdate=true;
  const glow=new T.Sprite(new T.SpriteMaterial({map:texture,transparent:true,depthWrite:false,blending:T.AdditiveBlending}));glow.scale.set(2.15,2.15,1);flowee.add(glow);
  const light=new T.PointLight('#00ebc7',.3,3.5);flowee.add(light);
  function update(time,moving){if(!Number.isFinite(time))return;tails.forEach((tail,i)=>{tail.rotation.x=Math.sin(time*1.7+i)*.045+(moving?.18:0);});}
  return{navigator,flowee,update};
 }
 const api=Object.freeze({build});root.CDFSanctuaryCharacters=api;if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof window==='undefined'?globalThis:window);

