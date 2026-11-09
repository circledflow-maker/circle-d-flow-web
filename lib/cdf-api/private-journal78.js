/* Private, explicitly self-reported memories. Never awards or verifies attendance. */
const fail=(message,status=503)=>Object.assign(Error(message),{status});
const columns='id,kind,title,note,occurred_at,created_at,source';
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function validate(body,now=Date.now()){
 if(!body||typeof body!=='object'||Array.isArray(body))throw fail('Invalid journal request.',400);
 if(Object.keys(body).some(k=>!['action','id','kind','title','note','occurredAt'].includes(k)))throw fail('Unsupported journal fields.',400);
 if(!['create','update','delete'].includes(body.action)||!uuid.test(body.id||''))throw fail('Invalid journal request.',400);
 if(body.action==='delete')return {action:'delete',id:body.id};
 if(!['sanctuary','encounter','reflection'].includes(body.kind)||typeof body.title!=='string'||typeof body.note!=='string')throw fail('Invalid journal entry.',400);
 const title=body.title.trim(),note=body.note.trim();if(!title||title.length>80||note.length>1000||/[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(title+note))throw fail('Invalid journal text.',400);
 const occurredAt=body.occurredAt??null;
 if(occurredAt!==null&& (typeof occurredAt!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(occurredAt)||!Number.isFinite(Date.parse(occurredAt))||new Date(occurredAt).toISOString()!==occurredAt||Date.parse(occurredAt)>now+300000))throw fail('Invalid memory date.',400);
 return {action:body.action,id:body.id,kind:body.kind,title,note,occurredAt};
}
function project(row){return {id:row.id,kind:row.kind,title:row.title,note:row.note,occurredAt:row.occurred_at,createdAt:row.created_at,source:'self_reported'};}
async function handle(db,user,method,body={}){
 if(user.is_anonymous||!(user.email_confirmed_at||user.phone_confirmed_at))throw fail('Confirm your CDF account first.',403);
 if(method==='GET'){const r=await db.from('cdf_private_journal').select(columns).eq('member_id',user.id).order('created_at',{ascending:false}).order('id',{ascending:false}).limit(101);if(r.error)throw fail('Private journal unavailable.');return {memberId:user.id,entries:(r.data||[]).slice(0,100).map(project),hasMore:(r.data||[]).length>100};}
 if(method!=='POST')throw fail('Method not allowed.',405);
 const value=validate(body);
 if(value.action==='delete'){const r=await db.from('cdf_private_journal').delete().eq('member_id',user.id).eq('id',value.id).select('id');if(r.error)throw fail('Journal deletion failed.');return {memberId:user.id,deletedId:value.id};}
 const fields={kind:value.kind,title:value.title,note:value.note,occurred_at:value.occurredAt};
 if(value.action==='update'){const r=await db.from('cdf_private_journal').update(fields).eq('member_id',user.id).eq('id',value.id).select(columns).maybeSingle();if(r.error)throw fail('Journal update failed.');if(!r.data)throw fail('Entry not found.',404);return {memberId:user.id,entry:project(r.data)};}
 const inserted=await db.from('cdf_private_journal').upsert({member_id:user.id,id:value.id,...fields},{onConflict:'member_id,id',ignoreDuplicates:true});
 if(inserted.error)throw fail('Journal save failed.');
 const r=await db.from('cdf_private_journal').select(columns).eq('member_id',user.id).eq('id',value.id).maybeSingle();if(r.error||!r.data)throw fail('Journal save not confirmed.');
 if(['kind','title','note'].some(k=>r.data[k]!==fields[k])|| (r.data.occurred_at?Date.parse(r.data.occurred_at):null)!==(fields.occurred_at?Date.parse(fields.occurred_at):null))throw fail('Entry already exists. Reload before editing.',409);
 return {memberId:user.id,entry:project(r.data)};
}
module.exports={handle,validate};
