/* One verified CDF identity; Wako card is an entitlement on that same profile UUID. */
(function(root){'use strict';const pending=new Map();
 function safeNext(raw){if(typeof raw!=='string'||!raw.startsWith('/')||raw.startsWith('//')||/[\\\x00-\x20]/.test(raw))return null;try{const url=new URL(raw,'https://cdf.invalid');if(url.origin!=='https://cdf.invalid'||/%2f|%5c/i.test(url.pathname)||/\/(login|auth_callback)(\.html)?\/?$/.test(url.pathname))return null;return url.pathname+url.search+url.hash;}catch{return null;}}
 async function complete(client){
  const {data:sessionData,error:sessionError}=await client.auth.getSession();if(sessionError||!sessionData?.session?.access_token)throw Error('SIGN_IN_REQUIRED');
  const {data,error}=await client.auth.getUser();const user=data?.user;if(error||!user?.id||user.id!==sessionData.session.user.id||user.is_anonymous||!(user.email_confirmed_at||user.phone_confirmed_at))throw Error('VERIFIED_ACCOUNT_REQUIRED');
  if(pending.has(user.id))return pending.get(user.id);
  const task=(async()=>{try{
   const response=await root.fetch('/api/claim-member-card',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+sessionData.session.access_token},body:JSON.stringify({source:'cdf_identity'}),signal:AbortSignal.timeout(15000)});
   const card=await response.json();if(!response.ok&&card.error==='Only public discovery is connected in this preview')return {user,card:{status:'pending',reason:'preview_unavailable'}};if(!response.ok||!card.success||card.profileId!==user.id||!card.publicId)throw Error('CARD_SYNC_PENDING');
   return {user,card:{...card,status:'ready'}};
  }catch{return {user,card:{status:'pending'}};}})();pending.set(user.id,task);try{return await task;}finally{pending.delete(user.id);}
 }
 function destination(raw){return safeNext(raw)||'/pages/artist_sanctuary.html?welcome=register';}
 root.CDFIdentity={complete,safeNext,destination};if(typeof module==='object'&&module.exports)module.exports=root.CDFIdentity;
})(typeof window==='undefined'?globalThis:window);
