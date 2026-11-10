"""Original CDF traveller study; built-in Blender only, no external assets."""
import bpy, math, json, pathlib, hashlib, time, argparse, sys
from mathutils import Vector
parser=argparse.ArgumentParser(description='Original CDF Traveller64; use Blender --background --factory-startup.')
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
# A continuous, open-front garment with asymmetrical radial folds and weighted hem.
profiles=[(.14,.41,.27),(.20,.42,.28),(.37,.37,.25),(.63,.31,.225),(.88,.26,.20),(1.12,.24,.19),(1.34,.29,.20),(1.43,.30,.18)]
N=48;verts=[]
for row,(z,rx,ry) in enumerate(profiles):
 for j in range(N+1):
  a=.065+(2*math.pi-.13)*j/N;f=(.025*math.cos(9*a+.4)+.012*math.cos(14*a+z*3))*(1.15-z*.5);hem=.027*math.sin(a*3+.5)*(1-z/1.5)
  verts.append(((rx+f)*math.sin(a),-(ry+f)*math.cos(a),z+hem))
faces=[(k*(N+1)+j,k*(N+1)+j+1,(k+1)*(N+1)+j+1,(k+1)*(N+1)+j) for k in range(len(profiles)-1) for j in range(N)]
coat=mesh('CDF flowing open-front coat',verts,faces,cloth,1,.018)
for side,j in [(-1,0),(1,N)]:curve('CDF front mint piping '+str(side),[verts[k*(N+1)+j] for k in range(len(profiles))],.004,edge)
curve('CDF weighted curved hem',verts[:N+1],.005,leather)
# Shoulder mantle is sculpted into one soft falling panel rather than rigid blocks.
vs=[];nr=5
for k in range(nr):
 for j in range(N+1):
  a=.11+(2*math.pi-.22)*j/N;r=.15+.058*k;vs.append((r*math.sin(a),-r*.7*math.cos(a),1.49-.052*k+.018*math.sin(3*a+k*.3)))
mesh('CDF soft shoulder mantle',vs,[(k*(N+1)+j,k*(N+1)+j+1,(k+1)*(N+1)+j+1,(k+1)*(N+1)+j) for k in range(nr-1) for j in range(N)],cloth,1,.013)
# Real hood volume: open ellipse at the front, narrowing toward a round rear crown.
hoodrings=[(-.235,.245,.315),(-.18,.27,.34),(-.015,.28,.35),(.16,.235,.31),(.27,.14,.23),(.30,.025,.08)]
vs=[]
for k,(y,rx,rz) in enumerate(hoodrings):
 for j in range(N):
  a=2*math.pi*j/N;vs.append((rx*.84*math.cos(a)*(1+.015*math.sin(3*a)),y*.84,1.67+rz*.85*math.sin(a)))
fs=[(k*N+j,k*N+(j+1)%N,(k+1)*N+(j+1)%N,(k+1)*N+j) for k in range(len(hoodrings)-1) for j in range(N)];fs.append(tuple((len(hoodrings)-1)*N+j for j in reversed(range(N))))
mesh('CDF deep open hood',vs,fs,cloth,1,.026)
curve('CDF hood rolled rim',[vs[j] for j in range(N)]+[vs[0]],.012,leather)
ellipsoid('CDF faceless shadow inside hood',(0,.045,1.67),(.1596,.1176,.2125),lining)
# Closed long sleeves with cuff openings, actual gloves and separated relaxed fingers.
for side in [-1,1]:
 centers=[(side*.27,.005,1.36,.115),(side*.36,.015,1.26,.135),(side*.405,-.005,1.07,.12),(side*.405,-.06,.89,.09)]
 vs=[];ns=16
 for k,(x,y,z,r) in enumerate(centers):
  for j in range(ns):
   a=2*math.pi*j/ns;f=1+.035*math.cos(5*a+k*.8);vs.append((x+r*math.cos(a)*f,y+r*math.sin(a)*f,z+.014*math.sin(3*a)))
 mesh('CDF relaxed sleeve '+str(side),vs,[(k*ns+j,k*ns+(j+1)%ns,(k+1)*ns+(j+1)%ns,(k+1)*ns+j) for k in range(len(centers)-1) for j in range(ns)],cloth,1,.014)
 curve('CDF cuff seam '+str(side),vs[-ns:]+[vs[-ns]],.004,edge)
 ellipsoid('CDF gloved palm '+str(side),(side*.405,-.07,.835),(.066,.045,.085),leather)
 for f in range(4):curve('CDF relaxed finger '+str(side)+' '+str(f),[(side*(.365+f*.023),-.079,.805),(side*(.365+f*.023),-.085,.763),(side*(.361+f*.023),-.07,.744+abs(f-1.5)*.008)],.009,leather)
 curve('CDF resting thumb '+str(side),[(side*.35,-.065,.855),(side*.337,-.11,.82),(side*.35,-.12,.79)],.013,leather)
 ellipsoid('CDF boot '+str(side),(side*.13,-.045,.085),(.085,.17,.085),leather)
ellipsoid('CDF simple collar clasp',(0,-.219,1.36),(.028,.009,.028),brass)
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
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'cdf-traveller64.blend'))
bpy.ops.object.select_all(action='DESELECT')
for o in parts:o.select_set(True)
bpy.context.view_layer.objects.active=coat
bpy.ops.object.duplicate()
bpy.ops.object.convert(target='MESH')
bpy.ops.object.join()
runtime=bpy.context.object;runtime.name='CDF_Traveller64_Runtime'
bpy.ops.export_scene.gltf(filepath=str(OUT/'traveller64.glb'),export_format='GLB',use_selection=True,export_apply=True,export_animations=False,export_lights=False,export_cameras=False)
bpy.data.objects.remove(runtime,do_unlink=True)
data=(OUT/'traveller64.glb').read_bytes();length=int.from_bytes(data[12:16],'little');gltf=json.loads(data[20:20+length]);tris=0
for m in gltf.get('meshes',[]):
 for prim in m['primitives']:tris+=gltf['accessors'][prim['indices']]['count']//3 if 'indices' in prim else gltf['accessors'][prim['attributes']['POSITION']]['count']//3
manifest={'name':'CDF Traveller64','original_geometry':True,'external_assets':[],'external_uris':[b.get('uri') for b in gltf.get('buffers',[]) if b.get('uri')],'triangles':tris,'bytes':len(data),'mesh_count':len(gltf.get('meshes',[])),'primitive_count':sum(len(m['primitives']) for m in gltf.get('meshes',[])),'material_count':len(gltf.get('materials',[])),'sha256':hashlib.sha256(data).hexdigest(),'blender':bpy.app.version_string,'rigged':False,'browser_test':'NOT_RUN','physical_device':'NOT_RUN','style_approval':'pending Hope','seconds_before_render':round(time.time()-start,2)}
(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n');print('CDF_TRAVELLER64_MANIFEST '+json.dumps(manifest),flush=True)
bpy.ops.render.render(write_still=True)
manifest['total_seconds']=round(time.time()-start,2);manifest['studio_render_created']=True;(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
