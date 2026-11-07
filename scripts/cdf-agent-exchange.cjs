/* Bounded file exchange. No watchers, agent/API calls, Git operations or product writes. */
'use strict';
const fs=require('node:fs'),path=require('node:path');
const assignments={
 Cursor:{task:'CDF-INTRO36-QA',brief:'handoffs/2026-11-07_intro36_codex-an-cursor.md',outputs:['Docs/community-pilot/intro36-cursor-review-20261107.md','handoffs/2026-11-07_intro36_cursor-an-codex.md']},
 Antigravity:{task:'CDF-INTRO37-ART',brief:'handoffs/2026-11-07_intro37_codex-an-antigravity.md',outputs:['Docs/community-pilot/intro37-antigravity-direction-20261107.md','handoffs/2026-11-07_intro37_antigravity-an-codex.md']},
 Daiku:{task:'CDF-DAIKU44',brief:'handoffs/2026-11-07_pilot-pipeline_codex-an-daiku.md',outputs:['Docs/community-pilot/daiku44-pilot-pipeline-20261107.md','handoffs/2026-11-07_pilot-pipeline_daiku-an-codex.md']}
};
function plan(tasks){return Object.entries(assignments).map(([agent,a])=>{const task=tasks.tasks.find(t=>t.id===a.task);if(!task)throw Error('Missing canonical task '+a.task);return{agent,...a,canonical_state:task.state,exchange_status:task.exchange_status||'pending',delivery:'file_prepared_not_agent_started'};}).filter(item=>item.exchange_status!=='received_reviewed');}
function validate(pkg){const a=assignments[pkg?.agent];if(!a||pkg.task!==a.task||!/^([0-9a-f]{40})$/.test(pkg.base_commit||''))throw Error('Unknown assignment or missing exact base commit');
 if(!Array.isArray(pkg.files)||pkg.files.length!==a.outputs.length)throw Error('Expected exact output set');
 const found=new Set();for(const f of pkg.files){if(!a.outputs.includes(f.path)||found.has(f.path)||typeof f.content!=='string'||Buffer.byteLength(f.content)>200000)throw Error('Unexpected, duplicate or oversized output');found.add(f.path);}
 return pkg;
}
function inside(base,relative){const resolved=path.resolve(base,relative);if(!resolved.startsWith(path.resolve(base)+path.sep))throw Error('Path escapes exchange');return resolved;}
function run(root,args){
 root=path.resolve(root);const home=inside(root,'Team/collaboration'),mode=args[0]||'prepare';fs.mkdirSync(home,{recursive:true});
 if(mode==='prepare'){
  const canonical=JSON.parse(fs.readFileSync(inside(home,'canonical-tasks.json'),'utf8'));const queue=plan(canonical);
  for(const item of queue){const folder=inside(home,'inbox/'+item.agent);fs.mkdirSync(folder,{recursive:true});const brief=fs.readFileSync(inside(root,item.brief),'utf8');
   const packet={...item,source_commit:canonical.source_commit,brief_text:brief,return_package:'Team/collaboration/outbox/'+item.agent+'.json',instructions:'Read current GitHub status and this brief. No product edits. Export only the two approved outputs to the return package; coordinator reviews before publication. This file does not start your agent.'};
   fs.writeFileSync(path.join(folder,'current.json'),JSON.stringify(packet,null,2)+'\n');
  }
  for(const [agent,a]of Object.entries(assignments)){const task=canonical.tasks.find(t=>t.id===a.task);if(task?.exchange_status!=='received_reviewed')continue;
   const folder=inside(home,'inbox/'+agent);fs.mkdirSync(folder,{recursive:true});fs.writeFileSync(path.join(folder,'current.json'),JSON.stringify({agent,task:a.task,state:'received_reviewed',source_commit:canonical.source_commit,brief_text:'Kein neuer Auftrag. Ergebnis empfangen und geprüft; kreative Restentscheidungen getrennt offen.',outputs:[],delivery:'no_active_assignment'},null,2)+'\n');}
  fs.mkdirSync(inside(home,'outbox'),{recursive:true});fs.writeFileSync(inside(home,'queue.json'),JSON.stringify(queue,null,2)+'\n');
  return{prepared:queue.map(x=>x.agent),started:[],canonical_commit:canonical.source_commit};
 }
 if(mode==='receive'){
  const agent=args[1];if(!assignments[agent])throw Error('Unknown agent');
  const file=inside(home,'outbox/'+agent+'.json');const pkg=validate(JSON.parse(fs.readFileSync(file,'utf8')));if(pkg.agent!==agent)throw Error('Agent mismatch');
  fs.mkdirSync(inside(home,'review'),{recursive:true});const destination=inside(home,'review/'+agent+'-'+Date.now());fs.mkdirSync(destination,{recursive:false});
  for(const f of pkg.files)fs.writeFileSync(path.join(destination,path.basename(f.path)),f.content,{flag:'wx'});
  fs.writeFileSync(path.join(destination,'receipt.json'),JSON.stringify({agent,task:pkg.task,base_commit:pkg.base_commit,state:'received_unreviewed',files:pkg.files.map(f=>f.path)},null,2)+'\n');
  return{state:'received_unreviewed',review_directory:destination,published:false,product_changed:false};
 }
 throw Error('Use prepare or receive <Cursor|Antigravity|Daiku>');
}
module.exports={plan,validate,run};
if(require.main===module){try{const root=process.env.CDF_EXCHANGE_ROOT||'E:/circle-d-flow-web';console.log(JSON.stringify(run(root,process.argv.slice(2)),null,2));}catch(e){console.error(e.message);process.exitCode=1;}}
