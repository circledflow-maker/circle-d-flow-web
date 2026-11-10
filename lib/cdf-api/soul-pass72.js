/* No XP, role, card or reward mutation. All ownership is supplied by membership-auth. */
const socials=require('./member-socials');
const fail=(message,status=503)=>Object.assign(Error(message),{status});
async function read(db,user){
 const p=await db.from('profiles').select('username,member_display_name,exp,member_card_public_id,member_card_claimed_at').eq('id',user.id).maybeSingle();
 if(p.error||!p.data)throw fail('Soul Pass unavailable.');
 const s=await db.from('cdf_member_socials').select('instagram,tiktok,discord,share_public').eq('member_id',user.id).maybeSingle();
 return {memberId:user.id,profile:{name:p.data.member_display_name||p.data.username||null,exp:p.data.exp,cardPublicId:p.data.member_card_claimed_at?p.data.member_card_public_id:null},socials:s.error?null:s.data||{instagram:'',tiktok:'',discord:'',share_public:false}};
}
async function handle(db,user,method,body={}){
 if(user.is_anonymous||!(user.email_confirmed_at||user.phone_confirmed_at))throw fail('Confirm your CDF account first.',403);
 if(method==='GET')return read(db,user);
 if(method!=='POST')throw fail('Method not allowed.',405);
 if(body.action!=='socials'||typeof body.share_public!=='boolean'||['instagram','tiktok','discord'].some(k=>typeof body[k]!=='string'||body[k].length>160))throw fail('Check your social profiles.',400);
 await socials.save(db,user.id,body);
 const result=await read(db,user);if(!result.socials)throw fail('Could not confirm saved links.');return result;
}
module.exports={read,handle};
