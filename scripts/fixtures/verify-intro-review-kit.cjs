/* Run against an extracted frozen kit. No browser, GPU or account writes. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{spawn}=require('node:child_process');
const root=__dirname,manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.json'),'utf8'));
const child=spawn(process.execPath,[path.join(root,'serve-preview.cjs')],{cwd:root,windowsHide:true,stdio:['ignore','pipe','pipe']});
(async()=>{try{
 await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Server did not become ready')),5000);child.once('error',reject);child.once('exit',code=>reject(Error('Server exited '+code)));child.stdout.once('data',()=>{clearTimeout(timer);resolve();});});
 const base='http://127.0.0.1:3219';for(const item of manifest.files){const r=await fetch(base+'/'+item.path);assert.equal(r.status,200,item.path);}
 const page=await fetch(base+'/login?lang=de');assert.equal(page.status,200);assert.match(page.headers.get('content-security-policy'),/connect-src 'none'/);const html=await page.text();assert.ok(!html.includes('/js/vendor/supabase-'));assert.ok(!html.includes('/js/cdf_runtime_config.js'));assert.ok(html.includes('/preview-guard.js'));
 for(const name of ['/api/claim-member-card','/.env','/Team/private.json','/manifest.json'])assert.equal((await fetch(base+name)).status,404,name);
 assert.equal((await fetch(base+'/login',{method:'POST',body:'fictional'})).status,405);
 assert.equal((await fetch(base+'/sanctuary?intro=first-light')).status,200);
 console.log(JSON.stringify({source:manifest.ui_source_commit,public_files:manifest.files.length,all_delivered:true,private_api_404:true,post_405:true,account_sdk_absent:true,local_3d_libraries:true,browser:'NOT_RUN',physical_devices:'NOT_RUN'}));
 }catch(e){console.error(e);process.exitCode=1;}finally{child.kill();}})();
