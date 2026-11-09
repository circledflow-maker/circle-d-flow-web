/* One isolated PostgreSQL/WASM instance per process, for small desktop memory budgets. */
const {spawnSync}=require('node:child_process'),path=require('node:path');
const root=path.resolve(__dirname,'..');
for(const name of ['real SQL stores','database grants block','a failed symbol insert','server binds RPC']){
 const flags=['--v8-pool-size=1','--liftoff-only','--wasm-lazy-compilation','--no-wasm-tier-up'];
 if(process.allowedNodeEnvironmentFlags.has('--disable-wasm-trap-handler'))flags.unshift('--disable-wasm-trap-handler');
 const result=spawnSync(process.execPath,[...flags,'--test','--test-name-pattern='+name,'tests/orientation71.test.cjs'],{cwd:root,stdio:'inherit'});
 if(result.status!==0)process.exit(result.status||1);
}
