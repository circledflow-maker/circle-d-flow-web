/* Frozen review kit: loopback-only, GET/HEAD-only, 15 minute lifetime. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),crypto=require('node:crypto');
const root=path.join(__dirname,'public'),manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'manifest.json'),'utf8'));
const allowed=new Map(manifest.files.map(x=>[x.path,x]));
for(const [name,item]of allowed){const data=fs.readFileSync(path.join(root,name));if(crypto.createHash('sha256').update(data).digest('hex')!==item.sha256)throw Error('Frozen file mismatch: '+name);}
const aliases={'/':'index.html','/login':'pages/login.html','/login.html':'pages/login.html','/pages/login':'pages/login.html','/sanctuary':'pages/artist_sanctuary.html','/pages/artist_sanctuary':'pages/artist_sanctuary.html'};
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.txt':'text/plain; charset=utf-8'};
const csp="default-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'none'; form-action 'none'; frame-src 'none'; object-src 'none'; base-uri 'self'";
const server=http.createServer((req,res)=>{
 res.setHeader('Content-Security-Policy',csp);res.setHeader('Cache-Control','no-store');res.setHeader('X-Robots-Tag','noindex, nofollow, noarchive');res.setHeader('Referrer-Policy','no-referrer');
 if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);return res.end();}
 let url;try{url=new URL(req.url,'http://127.0.0.1');}catch{res.writeHead(400);return res.end();}
 const name=aliases[url.pathname]||url.pathname.slice(1);if(!allowed.has(name)){res.writeHead(404);return res.end();}
 res.setHeader('Content-Type',types[path.extname(name)]||'application/octet-stream');res.end(req.method==='HEAD'?undefined:fs.readFileSync(path.join(root,name)));
});
server.listen(3219,'127.0.0.1',()=>console.log('FROZEN '+manifest.ui_source_commit+' http://127.0.0.1:3219/login?lang=de'));
setTimeout(()=>server.close(),15*60*1000).unref();process.on('SIGINT',()=>server.close());
