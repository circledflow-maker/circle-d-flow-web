import json,re,hashlib
from pathlib import Path
GUARD=(Path(__file__).parent/'fixtures/intro-preview-guard.js').read_text('utf-8')
root=Path('E:/circle-d-flow-web')
stage=root/'Team/previews/intro42-20261107'
stage.mkdir(parents=True,exist_ok=True)
public=stage/'public';public.mkdir(exist_ok=True)
excluded={'js/vendor/supabase-2.108.2.js','js/cdf_runtime_config.js','js/agents/supabase_client.js','js/auth-handler.js'}
urls=set();html={}
note='<div role="note" style="position:relative;z-index:5;padding:5px 10px;background:#173b3b;color:#effff6;font:11px/1.3 system-ui">Internet-Designvorschau · Intro42 · nur Fantasiedaten · echte Anmeldung deaktiviert</div>'
for name in ['pages/login.html','pages/artist_sanctuary.html']:
 s=(root/name).read_text('utf-8')
 for p in excluded:s=re.sub(r'<script\b[^>]*src="/'+re.escape(p)+r'(?:\?[^"]*)?"[^>]*>\s*</script>','',s)
 s=s.replace('<head>','<head><script src="/preview-guard.js"></script><meta name="robots" content="noindex,nofollow">').replace('<body>','<body>'+note)
 html[name]=s
 urls.update(u.split('?')[0].lstrip('/') for u in re.findall(r'(?:src|href)="([^"]+)"',s) if u.startswith(('/js/','/css/')))
for name in sorted(urls):
 assert name not in excluded
 p=public/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes((root/name).read_bytes())
for name,s in html.items():
 p=public/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(s,encoding='utf-8')
(public/'preview-guard.js').write_text(GUARD,encoding='utf-8')
(public/'index.html').write_text('<!doctype html><meta name="robots" content="noindex"><meta http-equiv="refresh" content="0;url=/login?lang=de"><a href="/login?lang=de">Intro starten</a>',encoding='utf-8')
(public/'preview-info.html').write_text('<!doctype html><html lang="de"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>CDF Designvorschau</title><body style="background:#091f26;color:#dff4e9;font:18px/1.6 system-ui;padding:24px"><h1>Intro-Designvorschau</h1><p>Diese begrenzte Vorschau enthält den Einstieg und das Sanctuary. Weitere Appbereiche und echte Kontofunktionen sind hier nicht freigeschaltet.</p><p><a style="color:#b4ebd7" href="/login?lang=de">Zum Intro</a> · <a style="color:#b4ebd7" href="/sanctuary?intro=first-light">Zum Sanctuary</a></p></body></html>',encoding='utf-8')
config={'version':2,'framework':None,'buildCommand':'','installCommand':'','outputDirectory':'public','cleanUrls':True,'rewrites':[{'source':'/login','destination':'/pages/login.html'},{'source':'/sanctuary','destination':'/pages/artist_sanctuary.html'}],'headers':[{'source':'/(.*)','headers':[{'key':'Content-Security-Policy','value':"connect-src 'none'; form-action 'none'; frame-src 'none'; object-src 'none'; base-uri 'self'"},{'key':'X-Robots-Tag','value':'noindex, nofollow, noarchive'},{'key':'Cache-Control','value':'no-store'},{'key':'Referrer-Policy','value':'no-referrer'}]}]}
(stage/'vercel.json').write_text(json.dumps(config,indent=2)+'\n',encoding='utf-8')
files=sorted(set([stage/'vercel.json']+[public/name for name in sorted(urls)]+[public/name for name in html]+[public/name for name in ['preview-guard.js','index.html','preview-info.html']]))
manifest=[{'path':str(p.relative_to(stage)).replace('\\','/'),'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'bytes':p.stat().st_size} for p in files]
assert all(not any(bad in x['path'].split('/') for bad in ['.git','.env','api','Team','handoffs']) for x in manifest)
assert all(not (public/p).exists() for p in excluded)
assert 'requestSubmit' not in GUARD
(stage/'manifest.json').write_text(json.dumps({'version':'intro42','source_commit':'16a813f19ca980ec815c893741d2ef15808c2059','files':manifest,'excluded_backend_files':sorted(excluded)},indent=2)+'\n',encoding='utf-8')
print(json.dumps({'stage':str(stage),'files':len(files),'bytes':sum(x['bytes'] for x in manifest),'backend_files':0,'private_files':0}))
