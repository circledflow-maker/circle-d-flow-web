"""Build one frozen, guarded, portable UI review kit. No network or secret loading."""
import argparse,hashlib,json,re,zipfile
from pathlib import Path
p=argparse.ArgumentParser()
p.add_argument('--root',required=True);p.add_argument('--out',required=True)
p.add_argument('--three',required=True);p.add_argument('--controls',required=True);p.add_argument('--license',required=True)
args=p.parse_args();root=Path(args.root).resolve();out=Path(args.out).resolve()
assert not out.exists(), 'Choose a new empty output path; existing files are never overwritten'
out.mkdir(parents=True);public=out/'public';public.mkdir()
source='1d60a3f3908efc6f22451b6e7add0fda8cc9e2a1'
excluded={'js/vendor/supabase-2.108.2.js','js/cdf_runtime_config.js','js/agents/supabase_client.js','js/auth-handler.js'}
data={};provenance=[]
for name in ['pages/login.html','pages/artist_sanctuary.html']:
 raw=(root/name).read_bytes();s=raw.decode('utf-8')
 provenance.append({'path':name,'sha256_before_preview_transform':hashlib.sha256(raw).hexdigest()})
 for blocked in excluded:s=re.sub(r'<script\b[^>]*src="/'+re.escape(blocked)+r'(?:\?[^"]*)?"[^>]*>\s*</script>','',s)
 s=s.replace('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js','/js/vendor/three-r128-preview.js').replace('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js','/js/vendor/OrbitControls-r128-preview.js')
 s=re.sub(r'<link\b[^>]*href="https?://[^"]*"[^>]*>','',s)
 s=s.replace('<head>','<head><script src="/preview-guard.js"></script><meta name="robots" content="noindex,nofollow">')
 s=s.replace('<body>','<body><div role="note" style="position:relative;z-index:5;padding:4px 10px;background:#173b3b;color:#effff6;font:11px system-ui">Eingefrorene Intro49-Prüfvorschau · nur Fantasiedaten · Kontoaktionen deaktiviert</div>')
 data[name]=s.encode()
 for ref in re.findall(r'(?:src|href)="([^"]+)"',s):
  path=ref.split('?')[0].lstrip('/')
  if path.startswith(('js/','css/')) and 'preview.js' not in path:
   assert path not in excluded,path
   raw=(root/path).read_bytes();provenance.append({'path':path,'sha256_before_preview_transform':hashlib.sha256(raw).hexdigest()})
   if path=='js/luvo_scene.js':raw=raw.replace(b'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',b'/js/vendor/three-r128-preview.js')
   data[path]=raw
guard=(root/'scripts/fixtures/intro-preview-guard.js').read_text(encoding='utf-8').replace("version:'intro42'","version:'intro49-review-kit'").replace("source:'16a813f19ca980ec815c893741d2ef15808c2059'","source:'"+source+"'")
data['preview-guard.js']=guard.encode()
data['js/vendor/three-r128-preview.js']=Path(args.three).read_bytes()
data['js/vendor/OrbitControls-r128-preview.js']=Path(args.controls).read_bytes()
data['THREE-LICENSE.txt']=Path(args.license).read_bytes()
data['index.html']=b'<!doctype html><meta http-equiv="refresh" content="0;url=/login?lang=de"><a href="/login?lang=de">Intro</a>'
data['preview-info.html']=b'<!doctype html><meta charset="utf-8"><h1>Begrenzte Designvorschau</h1><p>Weitere Appbereiche und echte Kontofunktionen sind deaktiviert.</p><a href="/login?lang=de">Zum Intro</a>'
# Include only an explicitly referenced transition image if present; no directory walk.
for name in ['assets/room_loading/courtyard-door.svg']:
 if (root/name).exists():data[name]=(root/name).read_bytes()
for name,raw in data.items():
 assert not any(x in name.split('/') for x in ['Team','api','.git','.env','handoffs'])
 assert name not in excluded
 target=public/name;target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(raw)
for name,raw in data.items():
 if name.endswith('.html'):
  for ref in re.findall(r'(?:src|href)="([^"]+)"',raw.decode()):
   path=ref.split('?')[0].lstrip('/')
   if ref.startswith(('/js/','/css/','/preview-guard')):assert path in data,(name,path)
manifest={'kit':'intro49-review-kit','ui_source_commit':source,'dependency_scope':'Explicit public E-source dependencies; not full production release','account_actions':False,'device_pairing':False,'external_3d_scripts':False,'files':[{'path':n,'sha256':hashlib.sha256(v).hexdigest(),'bytes':len(v)} for n,v in sorted(data.items())],'source_inputs':sorted(provenance,key=lambda x:x['path'])}
(out/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
(out/'serve-preview.cjs').write_bytes((root/'scripts/fixtures/serve-intro-review-kit.cjs').read_bytes())
(out/'verify-kit.cjs').write_bytes((root/'scripts/fixtures/verify-intro-review-kit.cjs').read_bytes())
(out/'README.txt').write_text('Frozen Intro49 review kit. Node.js only; no install/env/account needed. First: node verify-kit.cjs . Then: node serve-preview.cjs\nOpen http://127.0.0.1:3219/login?lang=de . Server is loopback-only and exits after15 minutes. No real login/registration, no private device pairing, no production claim. Manifest verifies public files before serving. Three.js r128 and OrbitControls r128 included with MIT notice. Mark actual browser/GPU and physical tests separately.\n',encoding='utf-8')
archive=out.with_suffix('.zip')
with zipfile.ZipFile(archive,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=9) as z:
 for name in ['manifest.json','serve-preview.cjs','verify-kit.cjs','README.txt']+['public/'+n for n in sorted(data)]:
  info=zipfile.ZipInfo(name,date_time=(2026,11,8,0,0,0));info.compress_type=zipfile.ZIP_DEFLATED;z.writestr(info,(out/name).read_bytes())
print(json.dumps({'archive':str(archive),'sha256':hashlib.sha256(archive.read_bytes()).hexdigest(),'bytes':archive.stat().st_size,'public_files':len(data),'source':source}))
