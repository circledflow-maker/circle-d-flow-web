/* One original Flowee silhouette in DOM and Three.js. Colour is presentation, never authority. */
(function(root){'use strict';
 const wings=['M73 58 C32 8 10 18 27 46 C40 63 59 65 73 58Z','M87 58 C128 8 150 18 133 46 C120 63 101 65 87 58Z','M72 65 C39 65 31 92 53 86 C66 82 73 73 72 65Z','M88 65 C121 65 129 92 107 86 C94 82 87 73 88 65Z'];
 function color(value){return typeof value==='string'&&/^#[0-9a-f]{6}$/i.test(value)?value:'#12efc9';}
 function svg({color:tint}={}){const c=color(tint);return '<svg class="cdf-fairy" viewBox="0 0 160 120" width="100%" height="100%" aria-hidden="true"><g fill="#f1d293"><circle cx="59" cy="91" r="2"/><circle cx="45" cy="99" r="1.5"/><circle cx="30" cy="102" r="1"/></g><g stroke="'+c+'" stroke-width="1.2" fill="'+c+'" fill-opacity=".25">'+wings.map(d=>'<path class="fairy-wing" d="'+d+'"/>').join('')+'</g><circle cx="80" cy="59" r="25" fill="'+c+'" opacity=".12"/><circle cx="80" cy="59" r="17" fill="'+c+'"/><circle cx="76" cy="54" r="9" fill="#d7fff5"/><circle cx="73" cy="51" r="3" fill="#fff"/><path d="M112 16v9m-4-4h8" stroke="#f1d293" stroke-linecap="round"/></svg>';}
 function sprite(T,{color:tint,registerTexture=()=>{},registerMaterial=()=>{}}={}){
  if(!root.document||!root.Path2D)return new T.Group();
  const c=color(tint),canvas=root.document.createElement('canvas');canvas.width=256;canvas.height=192;const ctx=canvas.getContext('2d');ctx.scale(1.6,1.6);
  function circle(x,y,r,fill,alpha=1){ctx.globalAlpha=alpha;ctx.fillStyle=fill;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();}
  for(const [x,y,r]of [[59,91,2],[45,99,1.5],[30,102,1]])circle(x,y,r,'#f1d293');
  ctx.fillStyle=c;ctx.strokeStyle=c;ctx.lineWidth=1.2;for(const d of wings){const p=new root.Path2D(d);ctx.globalAlpha=.25;ctx.fill(p);ctx.globalAlpha=.8;ctx.stroke(p);}
  circle(80,59,25,c,.12);circle(80,59,17,c);circle(76,54,9,'#d7fff5');circle(73,51,3,'#ffffff');ctx.globalAlpha=1;ctx.strokeStyle='#f1d293';ctx.beginPath();ctx.moveTo(112,16);ctx.lineTo(112,25);ctx.moveTo(108,20);ctx.lineTo(116,20);ctx.stroke();
  const texture=new T.CanvasTexture(canvas);texture.encoding=T.sRGBEncoding;registerTexture(texture);
  const material=new T.SpriteMaterial({map:texture,transparent:true,depthWrite:false,toneMapped:false});registerMaterial(material);
  const result=new T.Sprite(material);result.name='flowee-reference';result.scale.set(1.8,1.35,1);return result;
 }
 const api=Object.freeze({svg,sprite,color});root.CDFFloweeFairy=api;if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof window==='object'?window:globalThis);
