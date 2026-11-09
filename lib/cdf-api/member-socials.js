const fail=message=>Object.assign(Error(message),{status:400});
function handle(value,platform){
 if(typeof value!=='string')throw fail('Enter a social handle.');let s=value.trim();if(!s)return '';
 if(/^https?:\/\//i.test(s)){let u;try{u=new URL(s);}catch(_){throw fail('Invalid social link.');}
 const allowed={instagram:['instagram.com','www.instagram.com'],tiktok:['tiktok.com','www.tiktok.com'],discord:['discord.com','www.discord.com']}[platform];
 if(u.protocol!=='https:'||!allowed.includes(u.hostname)||u.username||u.password||u.port||u.search||u.hash)throw fail('Use the official social profile URL.');
 if(platform==='discord'){if(!/^\/users\/\d{15,22}\/?$/.test(u.pathname))throw fail('Use a Discord username or discord.com/users/ID.');return 'https://discord.com/users/'+u.pathname.split('/')[2];}
 if(!/^\/@?[A-Za-z0-9._]{1,30}\/?$/.test(u.pathname))throw fail('Use a profile link, not a post.');s=u.pathname.replace(/^\/@?|\/$/g,'');
 }
 s=s.replace(/^@/,'');if(!(platform==='discord'?/^[A-Za-z0-9._]{2,32}(?:#\d{4})?$/:/^[A-Za-z0-9._]{1,30}$/).test(s))throw fail('Invalid social handle.');return s;
}
async function save(db,member,body){const data={member_id:member,instagram:handle(body.instagram||'','instagram'),tiktok:handle(body.tiktok||'','tiktok'),discord:handle(body.discord||'','discord'),share_public:body.share_public===true,updated_at:new Date().toISOString()};const r=await db.from('cdf_member_socials').upsert(data);if(r.error)throw r.error;return data;}
module.exports={handle,save};
