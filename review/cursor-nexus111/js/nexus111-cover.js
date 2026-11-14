/* Binds Antigravity's CDFCover111 when present. Does not invent that adapter. */
(function(root, factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CDFNexus111Cover=api;
})(typeof globalThis!=='undefined'?globalThis:this, function(){
  'use strict';
  function available(adapter){return !!adapter&&typeof adapter.mount==='function';}
  function bind(adapter, host, onOpen){
    let opened=false;
    function openOnce(){
      if(opened)return false;
      opened=true;
      if(typeof onOpen==='function')onOpen();
      return true;
    }
    if(!available(adapter))return {source:'missing',openOnce};
    adapter.mount(host,{once:true,onOpen:openOnce});
    return {source:'CDFCover111',openOnce};
  }
  return {available,bind};
});
