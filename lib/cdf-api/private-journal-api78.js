const {createClient}=require('@supabase/supabase-js'),verifiedUser=require('./membership-auth'),{handle}=require('./private-journal78');
module.exports=async(req,res)=>{
 res.setHeader('Cache-Control','no-store');
 try{
  if(!['GET','POST'].includes(req.method))return res.status(405).json({error:'Method not allowed.'});
  const user=await verifiedUser(req);
  if(user.is_anonymous||!(user.email_confirmed_at||user.phone_confirmed_at))return res.status(403).json({error:'Confirm your CDF account first.'});
  let body={};if(req.method==='POST'){if(typeof req.body==='string'&&req.body.length>8192)return res.status(400).json({error:'Invalid request.'});try{body=typeof req.body==='string'?JSON.parse(req.body):req.body||{};}catch(_){return res.status(400).json({error:'Invalid request.'});}}
  const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_ANON_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if(!url||!key)throw Error('Missing private journal client configuration');
  // Verified bearer identity AND database RLS. Deliberately no service-role fallback.
  const db=createClient(url,key,{global:{headers:{Authorization:req.headers.authorization}},auth:{persistSession:false,autoRefreshToken:false}});
  return res.status(200).json(await handle(db,user,req.method,body));
 }catch(e){return res.status(e.status||503).json({error:e.status?e.message:'Private journal unavailable.'});}
};
