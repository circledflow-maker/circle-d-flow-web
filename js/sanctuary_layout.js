/* Original Sanctuary plan. Public coordinates describe a fictional plaza, not
 * real-world attendance, private people or GPS. Shared by rendering/movement. */
(function(root){
  'use strict';
  function freeze(value){if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;}
  const zones=[
    {id:'stage',x:0,z:-24,position:{x:0,z:-24},approach:{x:0,z:-15},radius:2.6,label:'Bantaba Stage',labels:{en:'Bantaba Stage',pt:'Palco Bantaba',de:'Bantaba Bühne'},color:'#b6a0ed',destination:'/pages/bantaba.html',description:'An open stage for music and creative gatherings. Check the published programme.'},
    {id:'kitchen',x:-19,z:-6,position:{x:-19,z:-6},approach:{x:-11,z:-6},radius:2.6,label:'Culinary · Kitchens',labels:{en:'Culinary · Kitchens',pt:'Culinary · Cozinhas',de:'Culinary · Küchen'},color:'#e9b57b',destination:'/pages/taste_world_hub.html',description:'Discover Akwaba Food. Ask the kitchen team about today’s menu and where to order.'},
    {id:'cinema',x:19,z:-7,position:{x:19,z:-7},approach:{x:10,z:-7},radius:2.6,label:'Open Cinema',labels:{en:'Open Cinema',pt:'Cinema Aberto',de:'Offenes Kino'},color:'#88d8e3',destination:'/pages/vision_studio.html',description:'A place for stories and creative work. Open Vision to see its actual available tools.'},
    {id:'guild',x:-19,z:15,position:{x:-19,z:15},approach:{x:-10,z:12},radius:2.6,label:'Guild Commons',labels:{en:'Guild Commons',pt:'Praça das Guildas',de:'Gildenplatz'},color:'#9ed3b4',destination:'/pages/worlds.html#kingdom-home',description:'Choose whether to form a guild or request membership through your Kingdom.'},
    {id:'atelier',x:19,z:15,position:{x:19,z:15},approach:{x:10,z:12},radius:2.6,label:'Creative Atelier',labels:{en:'Creative Atelier',pt:'Ateliê Criativo',de:'Kreativatelier'},color:'#d4a8c9',destination:'/pages/vision_studio.html',description:'Explore creative tools and your own work. Displayed scene art is original procedural decoration.'}
  ];
  const translatedDescriptions={
    stage:{pt:'Um palco aberto para música e encontros criativos. Consulta o programa publicado.',de:'Eine offene Bühne für Musik und kreative Treffen. Schau ins veröffentlichte Programm.'},
    kitchen:{pt:'Conhece o mundo da comida e confirma as ofertas atuais com quem organiza.',de:'Entdecke die Food-Welt und prüfe aktuelle Küchenangebote beim jeweiligen Veranstalter.'},
    cinema:{pt:'Um espaço para histórias e criação. Abre Vision para ver as ferramentas realmente disponíveis.',de:'Ein Ort für Geschichten und kreatives Arbeiten. Öffne Vision und sieh dir die tatsächlich verfügbaren Werkzeuge an.'},
    guild:{pt:'Escolhe se queres criar uma guilda ou pedir adesão através do teu Kingdom.',de:'Entscheide in deinem Kingdom, ob du eine Gilde gründen oder eine Mitgliedschaft anfragen möchtest.'},
    atelier:{pt:'Explora ferramentas criativas e o teu próprio trabalho. Os quadros expostos são ilustrações decorativas originais.',de:'Entdecke kreative Werkzeuge und deine eigenen Arbeiten. Die ausgestellten Bilder sind eigens gestaltete Dekoration.'}
  };
  zones.forEach(zone=>{zone.descriptions={en:zone.description,...translatedDescriptions[zone.id]};});
  const obstacles=[];
  function solid(id,minX,maxX,minZ,maxZ){obstacles.push({id,minX,maxX,minZ,maxZ});}
  // Stage: the low platform is traversable; equipment and structural posts are solid.
  solid('stage-back',-8.4,8.4,-29,-28.4);
  solid('stage-drumkit',-1.7,1.7,-27.4,-24.4);
  solid('stage-keyboard',-6.7,-3.3,-26.3,-23.9);
  solid('stage-guitar',3.7,5.8,-26.3,-23.7);
  solid('stage-percussion',2.3,4.1,-27.2,-26);
  solid('stage-microphone',1.9,3.05,-22,-20.85);
  [-6.8,6.8].forEach((x,index)=>solid('stage-speaker-'+index,x-.5,x+.5,-27.15,-26.2));
  [-7.8,7.8].forEach((x,index)=>{solid('stage-post-'+index,x-.25,x+.25,-20.45,-19.95);});
  // Kitchen has an open centre-facing service side, with access around the counter.
  [-11.5,-.5].forEach((z,index)=>solid('kitchen-porch-'+index,-14.2,-13.6,z-.3,z+.3));
  solid('kitchen-back',-24,-23.4,-12,0);
  solid('kitchen-side-north',-24,-14,-12,-11.5);
  solid('kitchen-side-south',-24,-14,-.5,0);
  solid('kitchen-counter',-16,-14.4,-10,-2);
  // Cinema opens west. Seats are individual obstacles with real aisles between them.
  solid('cinema-screen',23.35,24.2,-13.4,-.6);
  [15.2,17.5,19.8,22.1].forEach((x,row)=>[-11,-8.3,-5.6,-2.9].forEach((z,seat)=>solid('cinema-seat-'+row+'-'+seat,x-.65,x+.65,z-.85,z+.85)));
  solid('guild-back',-24,-23.4,9,21);
  solid('guild-table',-21.5,-17.5,13.1,16.9);
  [[-19.5,12.3],[-19.5,17.7],[-22.1,15]].forEach(([x,z],index)=>solid('guild-stool-'+index,x-.47,x+.47,z-.47,z+.47));
  solid('guild-front-post',-14.7,-14.3,20.3,20.7);
  solid('atelier-back',23.4,24,9,21);
  solid('atelier-table',17.5,22.5,17.4,20.2);
  [11,14.5].forEach((z,index)=>solid('atelier-easel-'+index,19.1,21.4,z-.9,z+.9));
  [[-10,-17],[10,-17],[-11,21],[11,21]].forEach(([x,z],index)=>solid('lantern-'+index,x-.2,x+.2,z-.2,z+.2));
  // Rear architectural silhouettes sit behind the stage; their feet are solid.
  solid('west-rear-house',-25,-11,-32,-30);
  solid('east-rear-house',11,25,-32,-30);
  const layout=freeze({version:1,bounds:{minX:-26,maxX:26,minZ:-32,maxZ:24},spawn:{x:0,z:12},zones,obstacles});
  root.CDFSanctuaryLayout=layout;
  if(typeof module==='object'&&module.exports)module.exports=layout;
})(typeof window==='undefined'?globalThis:window);
