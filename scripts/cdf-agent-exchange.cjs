/* Bounded file exchange. No watchers, agent/API calls, Git operations or product writes. */
'use strict';
const fs=require('node:fs'),path=require('node:path');
const agents=['Cursor','Antigravity','Daiku'];
const reportPath=/^Docs\/community-pilot\/[A-Za-z0-9][A-Za-z0-9._-]*\.md$/;
const handoffPath=/^handoffs\/[A-Za-z0-9][A-Za-z0-9._-]*\.md$/;
function validateAssignments(config){
 if(!config||config.version!==1||!config.assignments||typeof config.assignments!=='object'||Array.isArray(config.assignments))throw Error('Invalid assignment configuration');
 const entries=Object.entries(config.assignments),tasks=new Set(),outputs=new Set();
 if(entries.length!==agents.length||entries.some(([agent])=>!agents.includes(agent)))throw Error('Expected exact agent set');
 const safe=[];
 for(const [agent,a]of entries){
  if(!a||typeof a!=='object'||Object.keys(a).some(k=>!['task','brief','outputs'].includes(k))||!/^CDF-[A-Z0-9-]+$/.test(a.task||'')||tasks.has(a.task)||!handoffPath.test(a.brief||''))throw Error('Invalid or duplicate task/brief');
  if(!Array.isArray(a.outputs)||a.outputs.length!==2||!a.outputs.every(p=>typeof p==='string')||a.outputs.filter(p=>reportPath.test(p)).length!==1||a.outputs.filter(p=>handoffPath.test(p)).length!==1||new Set(a.outputs).size!==2)throw Error('Expected one report and one handoff');
  for(const p of a.outputs){if(outputs.has(p))throw Error('Shared output path');outputs.add(p);}
  tasks.add(a.task);safe.push([agent,Object.freeze({task:a.task,brief:a.brief,outputs:Object.freeze([...a.outputs])})]);
 }
 return Object.freeze(Object.fromEntries(safe));
}
const defaults=validateAssignments(require('../data/agent_exchange_assignments.json'));
function plan(tasks,assignments=defaults){
 if(!Array.isArray(tasks?.tasks))throw Error('Missing canonical tasks');
 return Object.entries(assignments).map(([agent,a])=>{const matches=tasks.tasks.filter(t=>t.id===a.task);if(matches.length!==1)throw Error('Missing or duplicate canonical task '+a.task);const task=matches[0];return{agent,...a,canonical_state:task.state,exchange_status:task.exchange_status||'pending',delivery:'file_prepared_not_agent_started'};}).filter(item=>item.exchange_status!=='received_reviewed');
}
function validate(pkg,assignments=defaults){
 const a=pkg&&Object.hasOwn(assignments,pkg.agent)?assignments[pkg.agent]:null;
 if(!a||pkg.task!==a.task||!/^([0-9a-f]{40})$/.test(pkg.base_commit||''))throw Error('Unknown assignment or missing exact base commit');
 if(!Array.isArray(pkg.files)||pkg.files.length!==a.outputs.length)throw Error('Expected exact output set');
 const found=new Set();for(const f of pkg.files){if(!f||!a.outputs.includes(f.path)||found.has(f.path)||typeof f.content!=='string'||Buffer.byteLength(f.content)>200000)throw Error('Unexpected, duplicate or oversized output');found.add(f.path);}
 return pkg;
}
function inside(base,relative){
 const resolvedBase=path.resolve(base),resolved=path.resolve(base,relative);
 if(!resolved.startsWith(resolvedBase+path.sep))throw Error('Path escapes exchange');
 let ancestor=resolved;while(!fs.existsSync(ancestor))ancestor=path.dirname(ancestor);
 const realBase=fs.realpathSync(resolvedBase),realAncestor=fs.realpathSync(ancestor);
 if(realAncestor!==realBase&&!realAncestor.startsWith(realBase+path.sep))throw Error('Linked path escapes exchange');
 return resolved;
}
function loadAssignments(root){return validateAssignments(JSON.parse(fs.readFileSync(inside(root,'data/agent_exchange_assignments.json'),'utf8')));}
function run(root,args){
 root=path.resolve(root);const assignments=loadAssignments(root),home=inside(root,'Team/collaboration'),mode=args[0]||'prepare';
 const canonical=JSON.parse(fs.readFileSync(inside(home,'canonical-tasks.json'),'utf8'));
 if(!/^[0-9a-f]{40}$/.test(canonical.source_commit||''))throw Error('Missing exact canonical source commit');
 const queue=plan(canonical,assignments); // Validate configured tasks before writing anything.
 if(mode==='prepare'){
  const ready=queue.map(item=>({...item,brief_text:fs.readFileSync(inside(root,item.brief),'utf8')}));
  for(const item of ready){const folder=inside(home,'inbox/'+item.agent);fs.mkdirSync(folder,{recursive:true});
   const packet={...item,source_commit:canonical.source_commit,assignment_version:1,return_package:'Team/collaboration/outbox/'+item.agent+'.json',instructions:'Read current GitHub status and this brief. No product edits or paid calls. Export only the two assigned outputs; coordinator reviews before publication. This file does not start your agent.'};
   fs.writeFileSync(inside(folder,'current.json'),JSON.stringify(packet,null,2)+'\n');
  }
  for(const [agent,a]of Object.entries(assignments)){const task=canonical.tasks.find(t=>t.id===a.task);if(task.exchange_status!=='received_reviewed')continue;
   const folder=inside(home,'inbox/'+agent);fs.mkdirSync(folder,{recursive:true});fs.writeFileSync(inside(folder,'current.json'),JSON.stringify({agent,task:a.task,state:'received_reviewed',source_commit:canonical.source_commit,brief_text:'Kein neuer Auftrag. Ergebnis empfangen und geprüft; kreative Restentscheidungen getrennt offen.',outputs:[],delivery:'no_active_assignment'},null,2)+'\n');
  }
  fs.mkdirSync(inside(home,'outbox'),{recursive:true});fs.writeFileSync(inside(home,'queue.json'),JSON.stringify(queue,null,2)+'\n');
  return{prepared:queue.map(x=>x.agent),started:[],canonical_commit:canonical.source_commit};
 }
 if(mode==='receive'){
  const agent=args[1];if(!Object.hasOwn(assignments,agent))throw Error('Unknown agent');
  const file=inside(home,'outbox/'+agent+'.json'),stat=fs.lstatSync(file);if(stat.isSymbolicLink()||stat.size>500000)throw Error('Unsafe or oversized return package');
  const pkg=validate(JSON.parse(fs.readFileSync(file,'utf8')),assignments);if(pkg.agent!==agent)throw Error('Agent mismatch');
  fs.mkdirSync(inside(home,'review'),{recursive:true});const destination=fs.mkdtempSync(inside(home,'review/'+agent+'-'));
  for(const f of pkg.files)fs.writeFileSync(path.join(destination,path.basename(f.path)),f.content,{flag:'wx'});
  const matches=pkg.base_commit===canonical.source_commit;
  fs.writeFileSync(path.join(destination,'receipt.json'),JSON.stringify({agent,task:pkg.task,base_commit:pkg.base_commit,current_source_commit:canonical.source_commit,base_matches_current:matches,state:'received_unreviewed',files:pkg.files.map(f=>f.path)},null,2)+'\n');
  return{state:'received_unreviewed',review_directory:destination,base_matches_current:matches,published:false,product_changed:false};
 }
 throw Error('Use prepare or receive <Cursor|Antigravity|Daiku>');
}
module.exports={plan,validate,run,validateAssignments,loadAssignments};
if(require.main===module){try{const root=process.env.CDF_EXCHANGE_ROOT||'E:/circle-d-flow-web';console.log(JSON.stringify(run(root,process.argv.slice(2)),null,2));}catch(e){console.error(e.message);process.exitCode=1;}}
