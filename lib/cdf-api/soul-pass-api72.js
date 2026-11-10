const {createClient}=require('@supabase/supabase-js'),verifiedUser=require('./membership-auth'),{handle}=require('./soul-pass72');
module.exports=async(req,res)=>{
 res.setHeader('Cache-Control','no-store');
 try{
  if(!['GET','POST'].includes(req.method))return res.status(405).json({error:'Method not allowed.'});
  const user=await verifiedUser(req);let body={};
  if(req.method==='POST'){try{body=typeof req.body==='string'?JSON.parse(req.body):req.body||{};}catch(_){return res.status(400).json({error:'Invalid request.'});}}
  const db=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
  return res.status(200).json(await handle(db,user,req.method,body));
 }catch(e){return res.status(e.status||503).json({error:e.status?e.message:'Soul Pass unavailable.'});}
};
