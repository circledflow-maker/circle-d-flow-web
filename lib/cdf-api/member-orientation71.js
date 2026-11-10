/* Verified ownership comes only from membership-auth, never the request body. */
const allowed=['music','visual','video','creator','support','wisdom','dance','sport','merchant','food'];
const fail=(message,status=400)=>Object.assign(Error(message),{status});
function normalize(body){if(!body||!Array.isArray(body.interests)||body.interests.length>3||body.interests.some(x=>typeof x!=='string'||!allowed.includes(x))||!['discover','contribute','collaborate'].includes(body.mode)||typeof body.betaInterest!=='boolean')throw fail('Check your orientation answers.');return{interests:[...new Set(body.interests)],mode:body.mode,betaInterest:body.betaInterest};}
async function read(db,user){const [o,s,p]=await Promise.all([
 db.from('cdf_member_orientation').select('interests,participation,beta_interest').eq('member_id',user.id).maybeSingle(),
 db.from('cdf_member_symbols').select('symbol_id,earned_at').eq('member_id',user.id).order('earned_at'),
 db.from('profiles').select('member_card_public_id,member_card_claimed_at').eq('id',user.id).maybeSingle()
]);if(o.error||s.error||p.error)throw fail('Orientation storage is not available yet.',503);
return{memberId:user.id,cardPublicId:p.data?.member_card_claimed_at?p.data.member_card_public_id:null,orientation:o.data?{interests:o.data.interests,mode:o.data.participation,betaInterest:o.data.beta_interest}:null,symbols:(s.data||[]).map(x=>({id:x.symbol_id,earnedAt:x.earned_at})),newSymbol:false};}
async function handle(db,user,method,body={}){
 if(user.is_anonymous||!(user.email_confirmed_at||user.phone_confirmed_at))throw fail('Confirm your CDF account first.',403);
 if(method==='GET')return read(db,user);
 if(method!=='POST')throw fail('Method not allowed.',405);
 if(body.operation==='clear'){const r=await db.from('cdf_member_orientation').delete().eq('member_id',user.id);if(r.error)throw fail('Could not remove orientation answers.',503);return read(db,user);}
 if(body.operation!=='complete')throw fail('Choose a supported orientation action.');
 const row=normalize(body),r=await db.rpc('cdf_complete_orientation',{p_member:user.id,p_interests:row.interests,p_mode:row.mode,p_beta_interest:row.betaInterest});
 if(r.error)throw fail(r.error.code==='P0002'?'Open and confirm your existing Member Card first.':'Orientation storage is not available yet.',r.error.code==='P0002'?409:503);
 if(r.data?.memberId!==user.id||!r.data.cardPublicId||!Array.isArray(r.data.symbols)||!r.data.symbols.some(s=>s.id==='orientation-first-step-v1')||typeof r.data.newSymbol!=='boolean')throw fail('Profile storage was not confirmed.',503);
 return r.data;
}
module.exports={normalize,read,handle};
