/* Original CDF place design. Lomé textile-market references inform the market,
   not a replica, partner stock or attributed sacred patterns. All props decorative. */
(function(root){
 'use strict';
 function build({T,scene,box,ball,mode}){
  const restaurant=mode==='culinary';
  const colors=restaurant?{ground:'#76503e',wall:'#9b583d',wood:'#513627',cloth:'#b86f42'}:{ground:'#bca17a',wall:'#d39469',wood:'#58462f',cloth:'#cf923b'};
  function b(...args){const o=box(...args);o.userData.decorativeOnly=true;return o;}
  function material(color){const m=new T.MeshStandardMaterial({color,roughness:.92});m.color.convertSRGBToLinear();return m;}
  function cylinder(x,y,z,rt,rb,h,color){const o=new T.Mesh(new T.CylinderGeometry(rt,rb,h,12),material(color));o.position.set(x,y,z);o.userData.decorativeOnly=true;scene.add(o);return o;}
  function fabric(color,accent){const c=document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d');if(!ctx)return null;ctx.fillStyle=color;ctx.fillRect(0,0,128,128);ctx.fillStyle=accent;for(let i=0;i<128;i+=16){ctx.fillRect(i,0,3,128);ctx.fillRect(0,i,128,2);}ctx.fillStyle='#fff4ce';for(let y=7;y<128;y+=32)for(let x=7;x<128;x+=32)ctx.fillRect(x,y,7,7);const t=new T.CanvasTexture(c);t.encoding=T.sRGBEncoding;t.wrapS=t.wrapT=T.RepeatWrapping;return t;}
  function cloth(o,color,accent,repeat=1){const map=fabric(color,accent);if(map){map.repeat.set(repeat,repeat);const m=material('#ffffff');m.map=map;o.material=m;}return o;}
  function plant(x,z){cylinder(x,.75,z,.8,.55,1.5,'#9b6948');for(const [dx,dy,dz]of [[0,2.4,0],[-.6,2,.2],[.6,2.1,-.1]]){const leaf=ball(x+dx,dy,z+dz,.65,'#476b40');leaf.scale.set(.7,1.7,.65);}}
  // Surrounding ground removes the floating-platform appearance; collision bounds stay unchanged.
  b(0,-.78,0,140,.3,140,colors.ground);
  if(restaurant){
   scene.background=new T.Color('#382c26');scene.fog=new T.Fog('#382c26',38,100);
   for(const x of [-17,17]){b(x,3.2,1,.4,6.4,26,colors.wall);b(x,1,1,.5,2,26,'#4b5440');}
   const rug=b(0,.085,5,5.8,.04,13,'#a55b39');cloth(rug,'#9c4e35','#d4b173',4);
   // Tables remain at the existing collision footprints; no invisible furniture.
   for(const x of [-7,7]){
    const runner=b(x,1.4,6,1.1,.03,2.8,'#c69865');cloth(runner,'#b46d42','#efd5a2',2);
    for(const dz of [-.85,.85]){
     cylinder(x,1.45,6+dz,.46,.46,.07,'#e7d9b3');
     cylinder(x+.75,1.63,6+dz,.13,.13,.42,'#a2b7a5');
    }
    cylinder(x,1.7,6,.18,.24,.6,'#a77846');ball(x,2.1,6,.28,'#57754d');
    // Upholstery and backrests use the bench footprints already in the layout.
    for(const dx of [-1.65,1.65]){b(x+dx,.84,6,.59,.12,2.25,'#b67046');b(x+dx,1.3,6+1.05,.6,.9,.16,colors.wood);}
   }
   for(const x of [-6,6])for(const z of [1,8]){
    const shade=cylinder(x,5.4,z,1,.65,1.1,'#b98c52');shade.userData.overhead=true;
    b(x,6.5,z,.06,1.2,.06,'#553b28').userData.overhead=true;
    const bulb=new T.Mesh(new T.SphereGeometry(.2,8,6),new T.MeshBasicMaterial({color:'#ffdb93',toneMapped:false}));bulb.position.set(x,4.9,z);scene.add(bulb);
    const lamp=new T.PointLight('#ffbd76',.75,15,2);lamp.position.set(x,4.5,z);scene.add(lamp);
   }
   for(const x of [-10,10]){const textile=b(x,4.2,-10.55,4,3,.08,'#6e5d3d');cloth(textile,'#594f3b','#c79355',2);}
   for(const x of [-14,14])plant(x,11);
  }else{
   scene.background=new T.Color('#a9c3c0');scene.fog=new T.Fog('#c6c8b2',45,125);
   // A sunny street edge: plaster façades and shutters, no fictitious active vendors.
   for(const [x,color]of [[-13,'#c77f5c'],[0,'#dcc5a0'],[13,'#b88b61']]){
    b(x,6,-16,12,12,5,color);b(x,12.2,-16,12.5,.35,5.5,'#eee0b7');
    for(const dx of [-3,3]){b(x+dx,7.9,-13.4,2,2.7,.2,'#476f6c');b(x+dx,7.9,-13.22,.1,2.7,.12,'#d4c592');}
    b(x,4.5,-13.3,10,.2,.4,'#f3d49a');
   }
   for(const x of [-20,20]){b(x,4.3,2,4,8.6,26,x<0?'#ba815f':'#d2ad7a');b(x,8.7,2,4.4,.3,26,'#e6cd9c');}
   // Folded display textiles and baskets are scenography, never catalogue items.
   for(const x of [-12,12]){
    const tabletop=b(x,1.42,6,2.8,.04,2.8,'#b57538');cloth(tabletop,x<0?'#c17b35':'#477f86','#ead5a3',2);
    for(let i=0;i<3;i++){const folded=b(x,1.55+i*.17,6,1.8,.15,1.1,['#af5846','#d9b35d','#427b79'][i]);cloth(folded,['#af5846','#d9b35d','#427b79'][i],'#f1dba0',2);}
   }
   for(const x of [-14,14]){cylinder(x,.7,11,.85,.6,1.4,'#ad8046');for(const dx of [-.4,0,.4])ball(x+dx,1.5,11,.3,'#c7a64e');}
   // Fabric bunting stays above the walkable street, not in the avatar sightline.
   for(let i=0;i<7;i++){const pennant=b(-12+i*4,7.3,-10,.9,.8,.05,['#c16d50','#d9b35d','#437b7a'][i%3]);pennant.rotation.z=.15;}
  }
 }
 root.CDFRoomAtmosphere=Object.freeze({build});
})(window);
