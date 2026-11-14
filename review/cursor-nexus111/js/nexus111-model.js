/* Nexus111 book state. No account writes, rewards, or storage. */
(function(root, factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CDFNexus111Model=api;
})(typeof globalThis!=='undefined'?globalThis:this, function(){
  'use strict';
  const CHAPTERS=['pass','chronicle','collection','calendar','account'];
  const SHARE_KEYS=['name','level','interests','symbols','instagram','tiktok','discord'];
  const INTERESTS=['music','visual','video','creator','support','wisdom','dance','sport','merchant','food'];
  const LEVELS=[0,500,1220,2500,5000,10000,25000,50000];
  function text(value, max){return typeof value==='string'?value.trim().slice(0,max||160):'';}
  function progress(value){
    if(!['number','string'].includes(typeof value)||value===''||!Number.isSafeInteger(Number(value))||Number(value)<0)return null;
    const exp=Number(value);let i=LEVELS.length-1;while(i&&exp<LEVELS[i])i--;
    return {level:i+1};
  }
  function favorites(state){
    return (Array.isArray(state?.symbols)?state.symbols:[])
      .filter(item=>item&&item.favorite&&typeof item.id==='string'&&Number.isFinite(Date.parse(item.earnedAt)))
      .slice(0,3);
  }
  function project(state, choices){
    const chosen=new Set(Array.isArray(choices)?choices.filter(key=>SHARE_KEYS.includes(key)):[]);
    const fields=[];
    if(chosen.has('name')&&text(state?.profile?.name,80))fields.push({key:'name',value:text(state.profile.name,80)});
    const level=progress(state?.profile?.exp);
    if(chosen.has('level')&&level)fields.push({key:'level',value:String(level.level)});
    if(chosen.has('interests')){
      const values=[...new Set((Array.isArray(state?.interests)?state.interests:[]).filter(item=>INTERESTS.includes(item)))].slice(0,3);
      if(values.length)fields.push({key:'interests',value:values});
    }
    if(chosen.has('symbols')){
      const values=favorites(state).map(item=>item.id);
      if(values.length)fields.push({key:'symbols',value:values});
    }
    for(const key of ['instagram','tiktok','discord'])if(chosen.has(key)&&text(state?.socials?.[key]))fields.push({key,value:text(state.socials[key])});
    return {kind:'cdf-meeting-pass-v1',fields};
  }
  function emptyState(){
    return {mode:'empty',profile:{name:'',exp:null,cardPublicId:null},socials:{},interests:[],symbols:[],chronicle:{tutorial:[],visits:[],encounters:[],memories:[]},events:[]};
  }
  function demoState(){
    return {
      mode:'demo',
      profile:{name:'Demo-Navigator',exp:null,cardPublicId:null},
      socials:{},
      interests:[],
      symbols:[
        {id:'orientation-first-step-v1',earnedAt:'2026-11-14',favorite:true},
        {id:'cdf-demo-lantern',earnedAt:'2026-11-14',favorite:true},
        {id:'cdf-demo-seal',earnedAt:'2026-11-14',favorite:true}
      ],
      chronicle:{tutorial:[],visits:[],encounters:[],memories:[]},
      events:[]
    };
  }
  function initial(){return {phase:'closed',chapter:'pass',opens:0,memory:null,scroll:{pass:0,chronicle:0,collection:0,calendar:0,account:0}};}
  function reduce(state, action){
    if(action.type==='open'){
      if(state.phase!=='closed')return state;
      return {...state,phase:'book',opens:state.opens+1};
    }
    if(action.type==='chapter'){
      if(state.phase==='closed'||!CHAPTERS.includes(action.chapter))return state;
      return {...state,phase:'book',chapter:action.chapter};
    }
    if(action.type==='read'||action.type==='share'||action.type==='journal'){
      if(state.phase==='closed')return state;
      return {...state,phase:action.type,memory:{chapter:state.chapter,focusId:action.focusId||'',scrollTop:action.scrollTop||0}};
    }
    if(action.type==='back'){
      if(state.phase==='read'||state.phase==='share'||state.phase==='journal'){
        const memory=state.memory||{chapter:state.chapter,focusId:'',scrollTop:0};
        return {...state,phase:'book',chapter:memory.chapter,memory,scroll:{...state.scroll,[memory.chapter]:memory.scrollTop}};
      }
      return state;
    }
    if(action.type==='scroll'){
      if(!CHAPTERS.includes(action.chapter))return state;
      return {...state,scroll:{...state.scroll,[action.chapter]:action.scrollTop||0}};
    }
    return state;
  }
  function chapterAfterGesture(index, dx, dy, origin){
    const current=Math.max(0,Math.min(CHAPTERS.length-1,Math.trunc(index)||0));
    if(origin==='scroll'||origin==='field')return current;
    if(!Number.isFinite(dx)||!Number.isFinite(dy))return current;
    const vertical=Math.abs(dy)>=56&&Math.abs(dy)>Math.abs(dx)*1.2;
    const horizontal=Math.abs(dx)>=56&&Math.abs(dx)>Math.abs(dy)*1.2;
    const delta=vertical?(dy>0?1:-1):horizontal?(dx<0?1:-1):0;
    return Math.max(0,Math.min(CHAPTERS.length-1,current+delta));
  }
  return {CHAPTERS,SHARE_KEYS,INTERESTS,progress,favorites,project,emptyState,demoState,initial,reduce,chapterAfterGesture};
});
