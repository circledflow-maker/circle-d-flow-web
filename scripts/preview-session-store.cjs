/* Ephemeral design-preview story sessions. No account fields or persistence. */
'use strict';
const {randomBytes}=require('node:crypto');
const steps=['city_light','flowee_lantern','many_worlds','first_step','return_path','threshold'];
function validState(s){return !!s&&typeof s==='object'&&!Array.isArray(s)&&Object.keys(s).length===2&&steps.includes(s.step)&&[null,'explore','create','learn','community'].includes(s.intent)&&Object.keys(s).every(k=>['step','intent'].includes(k));}
function createStore({now=Date.now,ttl=2*60*60*1000,max=20}={}){const sessions=new Map();
 function get(token){const s=sessions.get(token);if(!s)return null;if(now()>=s.expires){sessions.delete(token);return null;}return s;}
 return {create(state){for(const [k,s]of sessions)if(now()>=s.expires)sessions.delete(k);if(!validState(state))return{status:400};if(sessions.size>=max)return{status:429};const token=randomBytes(24).toString('hex'),s={revision:0,state:{...state},expires:now()+ttl};sessions.set(token,s);return{status:201,token,...s};},
 read(token){const s=get(token);return s?{status:200,...s,state:{...s.state}}:{status:404};},
 update(token,revision,state){const s=get(token);if(!s)return{status:404};if(!Number.isSafeInteger(revision)||!validState(state))return{status:400};if(revision!==s.revision)return{status:409,...s,state:{...s.state}};s.state={...state};s.revision++;return{status:200,...s,state:{...s.state}};}
 };}
module.exports={validState,createStore};
