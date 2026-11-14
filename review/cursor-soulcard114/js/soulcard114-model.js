/* SoulCard114 presentation rules. No storage, booking, or reward. */
(function(root, factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CDFSoulCard114Model=api;
})(typeof globalThis!=='undefined'?globalThis:this, function(){
  'use strict';
  const CHAPTERS=['pass','chronicle','collection','calendar','account'];
  const FRONT=['name','avatar','role','biography','instrument','skills','phrase'];
  const BACK=['symbols','visits','collaboration','contacts'];
  const MEETING=['name','level','interests','symbols','instagram','tiktok','discord'];
  function text(value, max){return typeof value==='string'?value.trim().slice(0,max||160):'';}
  function emailLike(value){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);}
  function precisePlace(value){return /^-?\d{1,3}\.\d+\s*,\s*-?\d{1,3}\.\d+$/.test(value)||/geo:|maps\.google|latitude|longitude/i.test(value);}
  function safeLine(value, max){const clean=text(value,max);if(!clean||emailLike(clean)||precisePlace(clean))return '';return clean;}
  function skills(list){return [...new Set((Array.isArray(list)?list:[]).map(item=>safeLine(item,40)).filter(Boolean))].slice(0,3);}
  function symbols(list){
    return (Array.isArray(list)?list:[]).filter(item=>item&&item.earned===true&&typeof item.id==='string'&&!item.private).slice(0,3).map(item=>({id:item.id,label:safeLine(item.label,40)||item.id}));
  }
  function visits(list){
    return (Array.isArray(list)?list:[]).map(item=>{
      if(!item||item.private)return '';
      return safeLine(typeof item==='string'?item:item.title,80);
    }).filter(Boolean).slice(0,3);
  }
  function contacts(list){
    return (Array.isArray(list)?list:[]).map(item=>{
      if(!item||item.kind==='email'||item.kind==='account'||item.private)return '';
      const value=safeLine(item.value,80);
      return value?{kind:safeLine(item.kind,24),value}:'';
    }).filter(Boolean).slice(0,3);
  }
  function present(source, choices){
    const chosen=new Set(Array.isArray(choices)?choices.filter(key=>FRONT.includes(key)||BACK.includes(key)):[]);
    const front={},back={};
    const card=source?.card||{};
    if(chosen.has('name')){const value=safeLine(source?.profile?.name,80);if(value)front.name=value;}
    if(chosen.has('avatar')){const value=safeLine(card.avatar,40);if(value)front.avatar=value;}
    if(chosen.has('role')){const value=safeLine(card.role,60);if(value)front.role=value;}
    if(chosen.has('biography')){const value=safeLine(card.biography,280);if(value)front.biography=value;}
    if(chosen.has('instrument')){const value=safeLine(card.instrument,80);if(value)front.instrument=value;}
    if(chosen.has('skills')){const value=skills(card.skills);if(value.length)front.skills=value;}
    if(chosen.has('phrase')){const value=safeLine(card.phrase,140);if(value)front.phrase=value;}
    if(chosen.has('symbols')){const value=symbols(source?.symbols);if(value.length)back.symbols=value;}
    if(chosen.has('visits')){const value=visits(source?.visits);if(value.length)back.visits=value;}
    if(chosen.has('collaboration')){const value=safeLine(card.collaboration,140);if(value)back.collaboration=value;}
    if(chosen.has('contacts')){const value=contacts(card.contacts);if(value.length)back.contacts=value;}
    return {kind:'cdf-soulcard-v1',front,back};
  }
  function meeting(source, choices){
    const chosen=new Set(Array.isArray(choices)?choices.filter(key=>MEETING.includes(key)):[]);
    const fields=[];
    if(chosen.has('name')){const value=safeLine(source?.profile?.name,80);if(value)fields.push({key:'name',value});}
    if(chosen.has('symbols')){const value=symbols(source?.symbols).map(item=>item.id);if(value.length)fields.push({key:'symbols',value});}
    for(const key of ['instagram','tiktok','discord']){
      if(!chosen.has(key))continue;
      const value=safeLine(source?.socials?.[key],80);
      if(value)fields.push({key,value});
    }
    return {kind:'cdf-meeting-pass-v1',fields};
  }
  function emptyState(){return {mode:'empty',profile:{name:'',email:'',balance:null,exp:null},card:{skills:[],contacts:[]},symbols:[],visits:[],diary:{privateNote:'',community:''},events:[]};}
  function demoState(){
    return {mode:'demo',profile:{name:'Demo-Navigator',email:'secret@example.test',balance:74,exp:null},card:{avatar:'DN',role:'',biography:'',instrument:'',skills:[],phrase:'',collaboration:'',contacts:[]},symbols:[{id:'cdf-demo-lantern',label:'Laterne',earned:true}],visits:[],diary:{privateNote:'Privater Satz, nicht auf der Karte.',community:''},events:[]};
  }
  function interviewPatch(answers){
    return {role:safeLine(answers?.role,60),instrument:safeLine(answers?.instrument,80),skills:skills(answers?.skills),phrase:safeLine(answers?.phrase,140),collaboration:safeLine(answers?.collaboration,140)};
  }
  function jamDraft(note){return {kind:'cdf-jam-participation-draft',status:'draft',booked:false,note:safeLine(note,140)};}
  function privateNote(note){return {kind:'cdf-private-note',text:text(note,500),saved:false,reason:'no-journal-connection'};}
  function communityDraft(note){return {kind:'cdf-community-draft',text:text(note,500),publish:false,saved:false,reason:'permissions-pending'};}
  function initial(){return {phase:'closed',chapter:'pass',opens:0,face:'front',memory:null};}
  function reduce(state, action){
    if(action.type==='open'){if(state.phase!=='closed')return state;return {...state,phase:'book',opens:state.opens+1};}
    if(action.type==='chapter'){if(state.phase==='closed'||!CHAPTERS.includes(action.chapter))return state;return {...state,phase:'book',chapter:action.chapter};}
    if(action.type==='meeting'||action.type==='read'||action.type==='diary'){
      if(state.phase==='closed')return state;
      return {...state,phase:action.type,memory:{chapter:state.chapter,focusId:action.focusId||'',scrollTop:action.scrollTop||0}};
    }
    if(action.type==='flip'){if(state.phase!=='meeting')return state;return {...state,face:state.face==='front'?'back':'front'};}
    if(action.type==='back'){
      if(state.phase==='meeting'||state.phase==='read'||state.phase==='diary'){
        const memory=state.memory||{chapter:state.chapter,focusId:'',scrollTop:0};
        return {...state,phase:'book',chapter:memory.chapter,face:'front',memory};
      }
      return state;
    }
    return state;
  }
  function chapterAfterGesture(index, dx, dy, origin){
    const current=Math.max(0,Math.min(CHAPTERS.length-1,Math.trunc(index)||0));
    if(origin==='scroll'||origin==='field'||origin==='card')return current;
    if(!Number.isFinite(dx)||!Number.isFinite(dy))return current;
    const vertical=Math.abs(dy)>=56&&Math.abs(dy)>Math.abs(dx)*1.2;
    const horizontal=Math.abs(dx)>=56&&Math.abs(dx)>Math.abs(dy)*1.2;
    const delta=vertical?(dy>0?1:-1):horizontal?(dx<0?1:-1):0;
    return Math.max(0,Math.min(CHAPTERS.length-1,current+delta));
  }
  return {CHAPTERS,FRONT,BACK,MEETING,present,meeting,interviewPatch,jamDraft,privateNote,communityDraft,emptyState,demoState,initial,reduce,chapterAfterGesture};
});
