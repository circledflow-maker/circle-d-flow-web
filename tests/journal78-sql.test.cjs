const{test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{PGlite}=require('@electric-sql/pglite');
test('real isolated PostgreSQL enforces private ownership, anonymous denial, fixed source and CRUD',async()=>{
 const db=new PGlite();try{
 await db.exec("create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;create function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$;grant usage on schema auth to authenticated;insert into auth.users values('11111111-1111-4111-8111-111111111111'),('22222222-2222-4222-8222-222222222222');");
 await db.exec(fs.readFileSync(path.join(__dirname,'../sql/pass78-private-journal.sql'),'utf8'));
 const a='11111111-1111-4111-8111-111111111111',b='22222222-2222-4222-8222-222222222222',id='33333333-3333-4333-8333-333333333333';
 async function act(owner,anonymous=false){await db.exec("reset role;set role authenticated");await db.query("select set_config('request.jwt.claim.sub',$1,false),set_config('request.jwt.claims',$2,false)",[owner,JSON.stringify({is_anonymous:anonymous})]);}
 await act(a);await db.query("insert into cdf_private_journal(member_id,id,kind,title,note) values($1,$2,'encounter','Synthetic memory','Private note')",[a,id]);
 let r=await db.query("select * from cdf_private_journal");assert.equal(r.rows.length,1);assert.equal(r.rows[0].source,'self_reported');assert.equal(r.rows[0].occurred_at,null);
 await db.query("update cdf_private_journal set title='Edited' where id=$1",[id]);assert.equal((await db.query('select title from cdf_private_journal')).rows[0].title,'Edited');
 await assert.rejects(()=>db.query('update cdf_private_journal set member_id=$1 where id=$2',[b,id]));
 await assert.rejects(()=>db.query("update cdf_private_journal set source='confirmed'"));
 await assert.rejects(()=>db.query("update cdf_private_journal set created_at=now()"));
 await act(b);assert.equal((await db.query('select * from cdf_private_journal')).rows.length,0);
 assert.equal((await db.query('delete from cdf_private_journal where id=$1 returning id',[id])).rows.length,0);
 await assert.rejects(()=>db.query("insert into cdf_private_journal(member_id,id,kind,title) values($1,$2,'sanctuary','Forged owner')",[a,id]));
 await act(a,true);assert.equal((await db.query('select * from cdf_private_journal')).rows.length,0);
 await assert.rejects(()=>db.query("insert into cdf_private_journal(member_id,id,kind,title) values($1,$2,'reflection','Anonymous')",[a,'44444444-4444-4444-8444-444444444444']));
 await act(a);await db.query('delete from cdf_private_journal where id=$1',[id]);assert.equal((await db.query('select * from cdf_private_journal')).rows.length,0);
 await db.exec('reset role;set role anon');await assert.rejects(()=>db.query('select * from cdf_private_journal'));
 }finally{await db.close();}
});
