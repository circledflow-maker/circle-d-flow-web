"""Original CDF traveller study; built-in Blender only, no external assets."""
import bpy, math, json, pathlib, hashlib, time, argparse, sys
from mathutils import Vector
parser=argparse.ArgumentParser(description='Original CDF Traveller66; run Blender --background --factory-startup.')
parser.add_argument('--output-dir',required=True)
args=parser.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else [])
OUT=pathlib.Path(args.output_dir).expanduser().resolve();OUT.mkdir(parents=True,exist_ok=True)
start=time.time();bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
def mat(name,c,rough=.7,metal=0,emission=None):
 m=bpy.data.materials.new(name);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*c,1);p.inputs['Roughness'].default_value=rough;p.inputs['Metallic'].default_value=metal
 if emission:p.inputs['Emission Color'].default_value=(*emission,1);p.inputs['Emission Strength'].default_value=.6
 return m
cloth=mat('CDF midnight woven cloth',(.014,.022,.033),.86);lining=mat('CDF hood lining',(.001,.0015,.002),.94);edge=mat('CDF quiet mint seam',(.18,.43,.38),.64);leather=mat('CDF charcoal leather',(.026,.036,.043),.65);brass=mat('CDF aged clasp',(.36,.26,.12),.4,.65)
parts=[]
def mesh(name,verts,faces,m,sub=0,solid=0):
 me=bpy.data.meshes.new(name);me.from_pydata(verts,[],faces);me.update();o=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(o);o.data.materials.append(m);parts.append(o)
 for p in me.polygons:p.use_smooth=True
 if sub:mod=o.modifiers.new('Cloth contour subdivision','SUBSURF');mod.levels=sub;mod.render_levels=sub
 if solid:mod=o.modifiers.new('Real cloth thickness','SOLIDIFY');mod.thickness=solid;mod.use_rim=True
 return o
def curve(name,pts,r,m):
 c=bpy.data.curves.new(name,'CURVE');c.dimensions='3D';c.resolution_u=3;c.bevel_depth=r;c.bevel_resolution=1;s=c.splines.new('BEZIER');s.bezier_points.add(len(pts)-1)
 for p,co in zip(s.bezier_points,pts):p.co=co;p.handle_left_type=p.handle_right_type='AUTO'
 o=bpy.data.objects.new(name,c);bpy.context.collection.objects.link(o);c.materials.append(m);parts.append(o);return o
def ellipsoid(name,loc,scale,m,segments=20,rings=12):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=segments,ring_count=rings,location=loc);o=bpy.context.object;o.name=name;o.scale=scale;o.data.materials.append(m)
 for p in o.data.polygons:p.use_smooth=True
 parts.append(o);return o
# Adult, fitted coat: two long open-front skirts reveal both legs below the waist.
profiles=[(.23,.32,.205,.78),(.28,.315,.207,.75),(.48,.29,.19,.68),(.76,.255,.17,.54),(1.02,.205,.152,.30),(1.15,.19,.148,.11),(1.36,.22,.16,.055),(1.55,.255,.16,.055),(1.65,.235,.145,.07),(1.68,.115,.105,.07)]
N=40;verts=[]
for row,(z,rx,ry,gap) in enumerate(profiles):
 for j in range(N+1):
  a=gap+(2*math.pi-2*gap)*j/N
  f=(.012*math.cos(10*a+z*.8)+.005*math.cos(15*a-z*2))*(1.15-z*.35)
  hem=.025*math.sin(2*a+.6)*(1-min(1,z/1.5))
  verts.append(((rx+f)*math.sin(a),-(ry+f)*math.cos(a),z+hem))
faces=[(k*(N+1)+j,k*(N+1)+j+1,(k+1)*(N+1)+j+1,(k+1)*(N+1)+j) for k in range(len(profiles)-1) for j in range(N)]
coat=mesh('CDF fitted coat with two open skirts',verts,faces,cloth,1,.014)
for side,j in [(-1,0),(1,N)]:curve('CDF split skirt piping '+str(side),[verts[k*(N+1)+j] for k in range(len(profiles))],.0034,edge)
curve('CDF long weighted hem',verts[:N+1],.004,leather)
# Slim inner waistcoat, two distinct fitted legs and structured boots, no shoulder cape.
ellipsoid('CDF fitted inner torso',(0,.005,1.30),(.174,.132,.31),lining)
def loft_leg(side):
 rings=[(.13,.07,.075),(.28,.075,.08),(.53,.064,.065),(.66,.079,.072),(.88,.087,.081),(1.08,.094,.086)]
 ns=20;vs=[]
 for z,rx,ry in rings:
  x=side*(.115+max(0,.62-z)*.025)
  for j in range(ns):
   a=2*math.pi*j/ns;vs.append((x+rx*math.cos(a),.016+ry*math.sin(a),z))
 fs=[(k*ns+j,k*ns+(j+1)%ns,(k+1)*ns+(j+1)%ns,(k+1)*ns+j) for k in range(len(rings)-1) for j in range(ns)]
 fs.extend([tuple(reversed(range(ns))),tuple((len(rings)-1)*ns+j for j in range(ns))])
 mesh('CDF fitted trouser leg '+str(side),vs,fs,lining,1)
for side in [-1,1]:
 loft_leg(side)
 ellipsoid('CDF narrow boot toe '+str(side),(side*.127,-.065,.085),(.068,.146,.072),leather)
 ellipsoid('CDF boot ankle '+str(side),(side*.127,.006,.19),(.070,.082,.15),leather)
 curve('CDF boot welt '+str(side),[(side*.127+.068*math.cos(a),-.063+.143*math.sin(a),.047) for a in [2*math.pi*j/20 for j in range(21)]],.004,leather)
# Tucked collar, separate neck and a significantly smaller anatomically placed hood.
ellipsoid('CDF high fitted collar',(0,.013,1.66),(.118,.105,.095),cloth)
hoodrings=[(-.235,.245,.315),(-.18,.27,.34),(-.015,.28,.35),(.16,.235,.31),(.27,.14,.23),(.30,.025,.08)]
vs=[]
for k,(y,rx,rz) in enumerate(hoodrings):
 for j in range(N):
  a=2*math.pi*j/N;vs.append((rx*.6888*math.cos(a)*(1+.015*math.sin(3*a)),y*.6888,1.84+rz*.697*math.sin(a)))
fs=[(k*N+j,k*N+(j+1)%N,(k+1)*N+(j+1)%N,(k+1)*N+j) for k in range(len(hoodrings)-1) for j in range(N)]
fs.append(tuple((len(hoodrings)-1)*N+j for j in reversed(range(N))))
mesh('CDF small deep open hood',vs,fs,cloth,1,.019)
curve('CDF narrow hood rolled rim',[vs[j] for j in range(N)]+[vs[0]],.008,leather)
ellipsoid('CDF faceless recessed shadow',(0,.037,1.84),(.131,.096,.174),lining)
# Slender human arms with taper, visible wrists and smaller relaxed five-finger gloves.
for side in [-1,1]:
 centers=[(side*.218,.01,1.61,.024),(side*.25,.01,1.57,.073),(side*.29,.012,1.43,.082),(side*.325,-.004,1.23,.067),(side*.32,-.065,1.035,.052)]
 vs=[];ns=16
 for k,(x,y,z,r) in enumerate(centers):
  for j in range(ns):
   a=2*math.pi*j/ns;f=1+.035*math.cos(5*a+k*.8);vs.append((x+r*math.cos(a)*f,y+r*math.sin(a)*f,z+.01*math.sin(3*a)))
 sleeve_faces=[(k*ns+j,k*ns+(j+1)%ns,(k+1)*ns+(j+1)%ns,(k+1)*ns+j) for k in range(len(centers)-1) for j in range(ns)];sleeve_faces.append(tuple(range(ns)))
 mesh('CDF slender tailored sleeve '+str(side),vs,sleeve_faces,cloth,1,.011)
 curve('CDF fine cuff seam '+str(side),vs[-ns:]+[vs[-ns]],.003,edge)
 ellipsoid('CDF smaller glove palm '+str(side),(side*.32,-.075,.985),(.044,.031,.063),leather)
 for f in range(4):
  x=side*(.292+f*.018)
  curve('CDF slender finger '+str(side)+' '+str(f),[(x,-.08,.958),(x,-.088,.922),(x-side*.003,-.079,.91+abs(f-1.5)*.006)],.0068,leather)
 curve('CDF relaxed thumb '+str(side),[(side*.283,-.072,.997),(side*.27,-.105,.97),(side*.282,-.115,.95)],.009,leather)
ellipsoid('CDF small collar clasp',(0,-.151,1.56),(.019,.008,.019),brass)
# Export evaluated, smooth geometry, preserving the editable modifier originals in .blend.
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.device='CPU';scene.cycles.samples=24
scene.render.resolution_x=800;scene.render.resolution_y=900;scene.render.resolution_percentage=100
scene.world.color=(.12,.12,.12)
def aim(o,target):o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(3.2,-5.8,2.5));cam=bpy.context.object;aim(cam,(0,0,1.03));cam.data.type='ORTHO';cam.data.ortho_scale=2.48;scene.camera=cam
for name,pos,power,size,col in [('Key',(-3,-4,5),650,4,(.88,.95,1)),('Warm rim',(2,2.2,3.8),950,3,(1,.74,.48)),('Fill',(3,-2,2),260,3,(.55,1,.85))]:
 bpy.ops.object.light_add(type='AREA',location=pos);l=bpy.context.object;l.name=name;l.data.energy=power;l.data.shape='DISK';l.data.size=size;l.data.color=col;aim(l,(0,0,1))
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.012));floor=bpy.context.object;floor.name='Studio only floor';floor.data.materials.append(mat('Studio slate',(.07,.10,.12),.9))
scene.view_settings.view_transform='AgX';scene.render.filepath=str(OUT/'render.png')
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'cdf-traveller66.blend'))
bpy.ops.object.select_all(action='DESELECT')
for o in parts:o.select_set(True)
bpy.context.view_layer.objects.active=coat
bpy.ops.object.duplicate()
bpy.ops.object.convert(target='MESH')
bpy.ops.object.join()
runtime=bpy.context.object;runtime.name='CDF_Traveller66_Runtime'
# glTF export uses +Y up and +Z forward; align horizontal bounds and feet exactly.
coords=[v.co for v in runtime.data.vertices]
lo=Vector(tuple(min(v[i] for v in coords) for i in range(3)));hi=Vector(tuple(max(v[i] for v in coords) for i in range(3)))
shift=Vector(((lo.x+hi.x)/2,(lo.y+hi.y)/2,lo.z))
for v in runtime.data.vertices:v.co-=shift
runtime.data.update()

bpy.ops.export_scene.gltf(filepath=str(OUT/'traveller66.glb'),export_format='GLB',use_selection=True,export_apply=True,export_animations=False,export_lights=False,export_cameras=False)
bpy.data.objects.remove(runtime,do_unlink=True)
data=(OUT/'traveller66.glb').read_bytes();length=int.from_bytes(data[12:16],'little');gltf=json.loads(data[20:20+length]);tris=0
for m in gltf.get('meshes',[]):
 for prim in m['primitives']:tris+=gltf['accessors'][prim['indices']]['count']//3 if 'indices' in prim else gltf['accessors'][prim['attributes']['POSITION']]['count']//3
manifest={'name':'CDF Traveller66','original_geometry':True,'external_assets':[],'external_uris':[b.get('uri') for b in gltf.get('buffers',[]) if b.get('uri')],'triangles':tris,'bytes':len(data),'mesh_count':len(gltf.get('meshes',[])),'primitive_count':sum(len(m['primitives']) for m in gltf.get('meshes',[])),'material_count':len(gltf.get('materials',[])),'sha256':hashlib.sha256(data).hexdigest(),'blender':bpy.app.version_string,'rigged':False,'browser_test':'NOT_RUN','physical_device':'NOT_RUN','style_approval':'pending Hope','seconds_before_render':round(time.time()-start,2),'coordinates':'glTF +Y up, front +Z, bounds centered X/Z, feet minY=0','revision':'one slender adult revision; no shoulder cape; open split skirts/two legs'}
(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n');print('CDF_TRAVELLER66_MANIFEST '+json.dumps(manifest),flush=True)
bpy.ops.render.render(write_still=True)
manifest['total_seconds']=round(time.time()-start,2);manifest['studio_render_created']=True;(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
