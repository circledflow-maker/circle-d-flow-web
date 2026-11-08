"""Original CDF coastal-house study. Blender 5.2; no downloaded assets or add-ons.

Run: blender --background --factory-startup --python this.py -- --output-dir PATH
Optional: --palette copper (default: mint). Does not change the web application.
"""
import argparse
import json
import math
import pathlib
import random
import sys

import bpy
from mathutils import Vector


def arguments():
    parser = argparse.ArgumentParser()
    parser.add_argument('--output-dir', required=True)
    parser.add_argument('--palette', choices=['mint', 'copper'], default='mint')
    return parser.parse_args(sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else [])


ARGS = arguments()
OUT = pathlib.Path(ARGS.output_dir).resolve()
OUT.mkdir(parents=True, exist_ok=True)
random.seed(55)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
scene = bpy.context.scene
scene.unit_settings.system = 'METRIC'
MODEL = bpy.data.collections.new('CDF_COASTAL55_ORIGINAL')
scene.collection.children.link(MODEL)


def owned(obj):
    for collection in list(obj.users_collection):
        collection.objects.unlink(obj)
    MODEL.objects.link(obj)
    return obj


def material(name, rgb, roughness=.6, metallic=0, alpha=1, emission=None):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    shader = mat.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Base Color'].default_value = (*rgb, alpha)
    shader.inputs['Roughness'].default_value = roughness
    shader.inputs['Metallic'].default_value = metallic
    shader.inputs['Alpha'].default_value = alpha
    if emission:
        shader.inputs['Emission Color'].default_value = (*emission, 1)
        shader.inputs['Emission Strength'].default_value = 1
    if alpha < 1:
        try:
            mat.surface_render_method = 'DITHERED'
        except (AttributeError, TypeError):
            pass
    mat.diffuse_color = (*rgb, alpha)
    return mat


plaster = material('CDF warm limestone plaster', (.65, .56, .40), .86)
edge = material('CDF pale carved stone', (.79, .72, .56), .8)
roofmat = material('CDF blue green roof', (.065, .22, .24) if ARGS.palette == 'mint' else (.32, .12, .06), .48, .22)
roofseam = material('CDF roof seam', (.075, .125, .12), .65)
brass = material('CDF aged brass', (.52, .31, .105), .4, .65)
wood = material('CDF smoked teal wood', (.045, .12, .13), .72)
bark = material('CDF warm tree bark', (.19, .105, .055), .91)
leaves = [material('CDF leaf '+str(i), color, .82) for i, color in enumerate([(.12, .29, .19), (.20, .40, .25), (.31, .48, .27), (.15, .36, .30)])]
stone = material('CDF coastal slate', (.19, .245, .23), .94)
soil = material('CDF island soil', (.105, .15, .13), .97)
moss = material('CDF moss', (.19, .27, .17), .95)
windowmat = material('CDF warm window glow', (.8, .39, .10), .38, emission=(1, .48, .12))
glass = material('CDF lantern pale glass', (.44, .73, .65), .14, alpha=.24)


def finish(obj, name, mat, smooth=False):
    owned(obj)
    obj.name = name
    if mat:
        obj.data.materials.append(mat)
    if smooth and obj.type == 'MESH':
        for polygon in obj.data.polygons:
            polygon.use_smooth = True
    return obj


def apply(obj, mod):
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.modifier_apply(modifier=mod.name)
    obj.select_set(False)


def rounded_box(name, loc, scale, mat, radius=.06):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    obj = finish(bpy.context.object, name, mat)
    obj.dimensions = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    bevel = obj.modifiers.new('Soft carved edges', 'BEVEL')
    bevel.width, bevel.segments = radius, 3
    apply(obj, bevel)
    # Keep broad facades flat while the bevels catch the cinematic light.
    for polygon in obj.data.polygons:
        polygon.use_smooth = polygon.area < .12
    return obj


def cylinder(name, loc, radius, depth, mat, vertices=32):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=loc)
    return finish(bpy.context.object, name, mat, True)


def orb(name, loc, scale, mat, detail=2):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=detail, radius=1, location=loc)
    obj = finish(bpy.context.object, name, mat, True)
    for vertex in obj.data.vertices:
        p = vertex.co
        p *= 1 + .07 * math.sin(p.x * 9 + p.z * 6) * math.cos(p.y * 7)
    obj.scale = scale
    return obj


def tube(name, points, radius, mat, radii=None, resolution=8):
    curve = bpy.data.curves.new(name, 'CURVE')
    curve.dimensions = '3D'
    curve.resolution_u = resolution
    curve.bevel_depth = radius
    curve.bevel_resolution = 2
    curve.resolution_u = resolution
    spline = curve.splines.new('BEZIER')
    spline.bezier_points.add(len(points)-1)
    for i, (point, co) in enumerate(zip(spline.bezier_points, points)):
        point.co = co
        point.handle_left_type = point.handle_right_type = 'AUTO'
        point.radius = radii[i] if radii else 1
    obj = bpy.data.objects.new(name, curve)
    MODEL.objects.link(obj)
    curve.materials.append(mat)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.convert(target='MESH')
    obj.select_set(False)
    for polygon in obj.data.polygons:
        polygon.use_smooth = True
    return obj


def arch(name, x, y, bottom, width, height, depth, mat):
    radius = width/2
    shoulder = bottom+height-radius
    outline = [(x-radius, bottom), (x+radius, bottom), (x+radius, shoulder)]
    outline += [(x+radius*math.cos(a), shoulder+radius*math.sin(a)) for a in [i*math.pi/16 for i in range(1, 17)]]
    n = len(outline)
    vertices = [(px, yy, pz) for yy in [y-depth/2, y+depth/2] for px, pz in outline]
    # The x/z contour is counter-clockwise when viewed from the front (-Y).
    # Outward normals are essential: an inverted cutter leaves a plaster infill.
    faces = [tuple(range(n)), tuple(reversed(range(n, n*2)))]
    faces += [(i, i+n, (i+1)%n+n, (i+1)%n) for i in range(n)]
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    MODEL.objects.link(obj)
    if mat:
        mesh.materials.append(mat)
    return obj


def inset_arch(house, name, x, bottom, width, height, y=-1.15):
    cutter = arch(name+' cutter', x, y, bottom, width, height, .7, None)
    boolean = house.modifiers.new(name+' real recess', 'BOOLEAN')
    boolean.operation = 'DIFFERENCE'
    boolean.solver = 'EXACT'
    boolean.object = cutter
    apply(house, boolean)
    bpy.data.objects.remove(cutter, do_unlink=True)
    arch(name+' warm inner pane', x, y+.22, bottom+.03, width-.09, height-.08, .025, windowmat)
    r = width/2+.055
    shoulder = bottom+height-width/2
    points = [(x-r, y-.025, bottom), (x-r, y-.025, shoulder)]
    points += [(x+r*math.cos(a), y-.025, shoulder+r*math.sin(a)) for a in [math.pi-i*math.pi/12 for i in range(1, 13)]]
    points += [(x+r, y-.025, bottom)]
    tube(name+' carved rim', points, .075, edge, resolution=2)
    return shoulder


# A sculpted floating coastal terrace, not a rectangular display plinth.
base = cylinder('Island rounded earth', (0, .1, -.12), 4.65, .55, soil, 64)
base.scale.y = .83
bevel = base.modifiers.new('Eroded island lip', 'BEVEL')
bevel.width, bevel.segments = .20, 3
apply(base, bevel)
top = cylinder('Moss terrace', (0, .1, .17), 4.53, .09, moss, 64)
top.scale.y = .83
for i in range(13):
    angle = i*2.399
    orb('Coastal edge rock '+str(i), (math.cos(angle)*4.3, math.sin(angle)*3.35, -.07), (.5, .34, .23), stone)

# The house is offset to leave a clearly readable tree and lantern silhouette.
HX = -1.05
house = rounded_box('Soft limestone coastal house', (HX, .12, 1.80), (3.1, 2.6, 3.18), plaster, .13)
rounded_box('Continuous stone foundation', (HX, .12, .30), (3.30, 2.77, .25), edge, .08)
doorx = HX-.43
inset_arch(house, 'Arched doorway', doorx, .39, .91, 1.85)
arch('Deep teal arched door', doorx, -.965, .40, .79, 1.75, .06, wood)
for dx in [-.22, 0, .22]:
    rounded_box('Door inset vertical seam', (doorx+dx, -1.008, 1.02), (.018, .018, 1.14), brass, .006)
orb('Door brass pull', (doorx+.22, -1.065, 1.13), (.044, .04, .044), brass)
inset_arch(house, 'Front upper arched window', HX+.73, 1.72, .61, 1.14)
rounded_box('Front window mullion', (HX+.73, -1.055, 2.14), (.04, .04, .83), brass, .012)
rounded_box('Front window sill', (HX+.73, -1.25, 1.69), (.87, .40, .13), edge, .05)
# A genuine side reveal on the visible east-facing facade.
sidecut = rounded_box('Side recess cutter', (HX+1.50, .23, 1.95), (.6, .73, 1.02), None, .10)
mod = house.modifiers.new('Side window true depth', 'BOOLEAN')
mod.operation, mod.solver, mod.object = 'DIFFERENCE', 'EXACT', sidecut
apply(house, mod)
bpy.data.objects.remove(sidecut, do_unlink=True)
rounded_box('Side window warm pane', (HX+1.28, .23, 1.95), (.035, .59, .88), windowmat, .06)
for yy in [-.15, .61]:
    rounded_box('Side window upright stone', (HX+1.59, yy, 1.95), (.14, .12, 1.10), edge, .045)
for zz in [1.40, 2.50]:
    rounded_box('Side window cross stone', (HX+1.59, .23, zz), (.14, .86, .12), edge, .045)
rounded_box('Side window brass mullion', (HX+1.57, .23, 1.95), (.05, .035, .91), brass, .01)


def roof_height(x):
    t = abs(x)/1.95
    return 4.70-1.25*t**.7+.16*t**6


# Continuous bowed roof surfaces with turned-up eaves and dark copper seams.
for side in [-1, 1]:
    xs = [side*(.035+1.915*i/14) for i in range(15)]
    verts = [(HX+x, y, roof_height(x)) for y in [-1.51, 1.75] for x in xs]
    faces = [(i, i+1, 16+i, 15+i) for i in range(14)]
    mesh = bpy.data.meshes.new('Bowed roof surface')
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new('CDF curved roof '+str(side), mesh)
    MODEL.objects.link(obj)
    mesh.materials.append(roofmat)
    for polygon in mesh.polygons:
        polygon.use_smooth = True
    solid = obj.modifiers.new('Roof thickness', 'SOLIDIFY')
    solid.thickness = .12
    apply(obj, solid)
    bevel = obj.modifiers.new('Soft roof rim', 'BEVEL')
    bevel.width, bevel.segments = .045, 2
    apply(obj, bevel)
    for y in [-1.50, -.86, -.22, .42, 1.06, 1.73]:
        tube('Roof standing seam', [(HX+x, y, roof_height(x)+.025) for x in xs[::2]], .018, roofseam, resolution=2)
    tube('Turned eave brass edge', [(HX+side*1.94, y, roof_height(1.94)) for y in [-1.52, -.5, .6, 1.76]], .045, brass, resolution=3)
tube('Roof soft ridge', [(HX, y, 4.72+.045*math.cos(y*1.2)) for y in [-1.6, -.6, .6, 1.85]], .12, roofmat, resolution=5)
# Solid curved loft closes the gap beneath the high roof rather than floating it.
loft_outline = [(HX-1.55, 3.34), (HX+1.55, 3.34)]
loft_outline += [(HX+x, roof_height(x)-.11) for x in [1.55-i*3.10/24 for i in range(25)]]
count = len(loft_outline)
loft_vertices = [(x, y, z) for y in [-1.18, 1.42] for x, z in loft_outline]
loft_faces = [tuple(range(count)), tuple(reversed(range(count, count*2)))]
loft_faces += [(i, i+count, (i+1)%count+count, (i+1)%count) for i in range(count)]
loft_mesh = bpy.data.meshes.new('Curved solid loft')
loft_mesh.from_pydata(loft_vertices, [], loft_faces)
loft_mesh.update()
loft = bpy.data.objects.new('CDF curved plaster gable', loft_mesh)
MODEL.objects.link(loft)
loft_mesh.materials.append(plaster)
rounded_box('Rounded chimney', (HX-.8, .92, 4.28), (.42, .48, 1.05), plaster, .09)
rounded_box('Chimney cap', (HX-.8, .92, 4.85), (.57, .62, .12), edge, .045)

# Recessed gable opening beneath the high roof, framed as original CDF geometry.
arch('Upper gable shadow', HX, -1.22, 3.42, .50, .72, .035, wood)
tube('Upper gable curve', [(HX-.29, -1.25, 3.43), (HX-.29, -1.25, 3.87), (HX, -1.25, 4.15), (HX+.29, -1.25, 3.87), (HX+.29, -1.25, 3.43)], .04, brass, resolution=4)

# Tree: tapering, curved trunk and distinct branch gestures; multiple leaf layers.
tube('Tree main curved trunk', [(2.10, .75, .22), (1.89, .72, 1.16), (2.22, .68, 2.15), (2.16, .80, 3.55)], .24, bark, [1.32, 1, .72, .19])
branches = [([(1.96, .72, 1.25), (2.72, .61, 1.90), (3.19, .56, 2.72)], .12),
            ([(2.13, .71, 1.99), (1.47, .54, 2.65), (1.28, .38, 3.17)], .11),
            ([(2.20, .73, 2.62), (2.78, 1.17, 3.19), (2.96, 1.32, 3.66)], .09),
            ([(2.17, .77, 2.83), (1.87, 1.18, 3.55), (1.91, 1.27, 4.08)], .085)]
for i, (points, r) in enumerate(branches):
    tube('Tree tapering branch '+str(i), points, r, bark, [1, .68, .13])
for i in range(4):
    a = i*1.7
    tube('Tree exposed root '+str(i), [(2.05, .75, .42), (2.05+math.cos(a)*.30, .75+math.sin(a)*.32, .25), (2.05+math.cos(a)*.70, .75+math.sin(a)*.58, .20)], .10, bark, [1, .65, .07], resolution=4)
crowns = [(1.20, .38, 3.32, .83, .59), (1.69, .48, 3.52, .85, .58), (2.10, .80, 3.83, .98, .68), (2.85, 1.25, 3.80, .86, .58), (3.20, .54, 2.89, .81, .53), (2.72, .57, 3.10, .85, .53), (1.97, 1.24, 4.15, .72, .48)]
for i, (x, y, z, width, high) in enumerate(crowns):
    orb('Tree layered leaf crown '+str(i), (x, y, z), (width, width*.76, high), leaves[i%4], 3)
    orb('Tree leaf lobe '+str(i), (x+.25, y-.22, z+.13), (width*.63, width*.57, high*.69), leaves[(i+1)%4], 2)

# Irregular paving stones lead to a lantern that reads as a lantern at small size.
for i in range(7):
    t = i/6
    x = doorx+(1-t)*1.2+.09*math.sin(i*2)
    y = -1.58-i*.28
    rock = orb('Worn path slab '+str(i), (x, y, .29), (.48, .29, .08), edge)
    rock.rotation_euler.z = math.sin(i)*.18

LX, LY, LZ = 1.28, -1.88, .70
cylinder('Lantern low stone pedestal', (LX, LY, .36), .38, .31, stone)
cylinder('Lantern broad brass foot', (LX, LY, LZ-.02), .29, .12, brass, 24)
rounded_box('Lantern warm light core', (LX, LY, LZ+.31), (.22, .22, .40), windowmat, .06)
for dx in [-.22, .22]:
    for dy in [-.22, .22]:
        tube('Lantern curved brass strut', [(LX+dx, LY+dy, LZ), (LX+dx*1.06, LY+dy*1.06, LZ+.30), (LX+dx*.88, LY+dy*.88, LZ+.61)], .028, brass, resolution=4)
for dx, dy, dims in [(0, -.226, (.40, .012, .53)), (0, .226, (.40, .012, .53)), (-.226, 0, (.012, .40, .53)), (.226, 0, (.012, .40, .53))]:
    rounded_box('Lantern glass panel', (LX+dx, LY+dy, LZ+.30), dims, glass, .005)
bpy.ops.mesh.primitive_cone_add(vertices=32, radius1=.34, radius2=.09, depth=.22, location=(LX, LY, LZ+.73))
finish(bpy.context.object, 'Lantern sloping brass cap', brass, True)
bpy.ops.mesh.primitive_torus_add(major_segments=24, minor_segments=8, location=(LX, LY, LZ+.98), major_radius=.15, minor_radius=.026, rotation=(math.pi/2, 0, 0))
finish(bpy.context.object, 'Lantern carry handle', brass, True)

# Small plants avoid turning the terrain into a uniform green disc.
for i in range(8):
    a = i*2.399
    x, y = math.cos(a)*3.5, math.sin(a)*2.7
    for j in range(3):
        leaf = orb('Low coastal planting', (x+.10*j, y, .32+.045*j), (.28, .12, .17), leaves[(i+j)%4], 2)
        leaf.rotation_euler.z = a+j*.6

# Evaluate only the model; cameras, lights and studio floor are excluded from GLB.
bpy.context.view_layer.update()
model_objects = list(MODEL.objects)
bounds = [obj.matrix_world @ Vector(corner) for obj in model_objects if obj.type == 'MESH' for corner in obj.bound_box]
depsgraph = bpy.context.evaluated_depsgraph_get()
triangles = 0
for obj in model_objects:
    if obj.type == 'MESH':
        evaluated = obj.evaluated_get(depsgraph)
        mesh = evaluated.to_mesh()
        mesh.calc_loop_triangles()
        triangles += len(mesh.loop_triangles)
        evaluated.to_mesh_clear()
manifest = {'project': 'Circle D Flow', 'study': 'Original coastal house, tree and lantern55', 'palette': ARGS.palette,
            'blender_version': bpy.app.version_string, 'original_geometry': True, 'external_assets': [],
            'triangles': triangles, 'target_triangles': 25000, 'within_target': triangles <= 25000,
            'model_objects': len(model_objects), 'materials': sorted({mat.name for obj in model_objects for mat in obj.data.materials if mat}),
            'bounds': {'min': [min(point[i] for point in bounds) for i in range(3)], 'max': [max(point[i] for point in bounds) for i in range(3)]},
            'files': ['cdf-coastal55.blend', 'export.glb', 'render.png'], 'device_visual_acceptance': 'NOT_RUN'}
# Export disposable copies in two draw groups. Keep every original editable part
# in the .blend; only the runtime GLB needs batching. The lantern remains named
# separately so it can receive an explicit interaction handler later.
export_collection = bpy.data.collections.new('CDF_EXPORT_TEMPORARY')
scene.collection.children.link(export_collection)
export_groups = {'CDF_StaticDiorama': [], 'CDF_Lantern_Interactive': []}
for original in model_objects:
    if original.type != 'MESH':
        continue
    duplicate = original.copy()
    duplicate.data = original.data.copy()
    duplicate.data.name = 'CDF_EXPORT_'+original.data.name
    export_collection.objects.link(duplicate)
    group_name = 'CDF_Lantern_Interactive' if original.name.startswith('Lantern') else 'CDF_StaticDiorama'
    export_groups[group_name].append(duplicate)
joined_exports = []
for group_name, objects in export_groups.items():
    bpy.ops.object.select_all(action='DESELECT')
    for obj in objects:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = objects[0]
    bpy.ops.object.join()
    joined = bpy.context.view_layer.objects.active
    joined.name = group_name
    # Collapse any repeated shared-material slots and preserve polygon mapping.
    unique_materials, remap = [], {}
    for slot_index, mat in enumerate(joined.data.materials):
        if mat not in unique_materials:
            unique_materials.append(mat)
        remap[slot_index] = unique_materials.index(mat)
    indices = [remap[polygon.material_index] for polygon in joined.data.polygons]
    joined.data.materials.clear()
    for mat in unique_materials:
        joined.data.materials.append(mat)
    for polygon, index in zip(joined.data.polygons, indices):
        polygon.material_index = index
    joined_exports.append(joined)
bpy.ops.object.select_all(action='DESELECT')
for obj in joined_exports:
    obj.select_set(True)
manifest['export_groups'] = {obj.name: len(obj.data.materials) for obj in joined_exports}
manifest['export_material_primitive_upper_bound'] = sum(len(obj.data.materials) for obj in joined_exports)
bpy.ops.export_scene.gltf(filepath=str(OUT/'export.glb'), export_format='GLB', use_selection=True,
                          export_apply=True, export_materials='EXPORT', export_cameras=False, export_lights=False, export_extras=False)
manifest['glb_bytes'] = (OUT/'export.glb').stat().st_size
for obj in list(export_collection.objects):
    bpy.data.objects.remove(obj, do_unlink=True)
bpy.data.collections.remove(export_collection)
for mesh in list(bpy.data.meshes):
    if mesh.users == 0 and mesh.name.startswith('CDF_EXPORT_'):
        bpy.data.meshes.remove(mesh)

# Studio render: diffuse rim light, soft shadows and an unobstructed 3/4 silhouette.
studio = bpy.data.collections.new('RENDER_ONLY_STUDIO')
scene.collection.children.link(studio)


def studio_object(obj):
    for collection in list(obj.users_collection):
        collection.objects.unlink(obj)
    studio.objects.link(obj)
    return obj


bpy.ops.mesh.primitive_plane_add(size=200, location=(0, 0, -.44))
floor = studio_object(bpy.context.object)
floor.name = 'Render only shadow floor'
floor.data.materials.append(material('Studio midnight teal', (.017, .038, .047), .94))
world = bpy.data.worlds.new('CDF night studio')
world.use_nodes = True
world.node_tree.nodes['Background'].inputs[0].default_value = (.07, .13, .18, 1)
world.node_tree.nodes['Background'].inputs[1].default_value = .25
scene.world = world


def area(name, loc, power, color, size):
    data = bpy.data.lights.new(name, 'AREA')
    data.energy, data.color, data.shape, data.size = power, color, 'DISK', size
    obj = bpy.data.objects.new(name, data)
    studio.objects.link(obj)
    obj.location = loc
    obj.rotation_euler = (Vector((0, 0, 1.5))-obj.location).to_track_quat('-Z', 'Y').to_euler()


area('Warm moon key', (-4, -6, 10), 1250, (1, .82, .61), 7)
area('Blue sea fill', (6, -1, 5), 800, (.45, .73, 1), 6)
area('Canopy rim', (2, 5, 8), 1700, (.63, 1, .82), 5)
light = bpy.data.lights.new('Lantern render light', 'POINT')
light.energy, light.color, light.shadow_soft_size = 18, (1, .45, .12), .25
obj = bpy.data.objects.new('Lantern render light', light)
studio.objects.link(obj)
obj.location = (LX, LY, LZ+.30)
camera_data = bpy.data.cameras.new('CDF preview camera')
camera = bpy.data.objects.new('CDF preview camera', camera_data)
studio.objects.link(camera)
camera.location = (8, -12, 8)
camera.rotation_euler = (Vector((0, .1, 1.9))-camera.location).to_track_quat('-Z', 'Y').to_euler()
camera_data.type, camera_data.ortho_scale = 'ORTHO', 12.6
camera_data.lens = 48
scene.camera = camera
scene.render.resolution_x, scene.render.resolution_y, scene.render.resolution_percentage = 1000, 800, 100
scene.render.image_settings.file_format = 'PNG'
scene.render.filepath = str(OUT/'render.png')
scene.render.film_transparent = False
scene.render.engine = 'CYCLES'
scene.cycles.device, scene.cycles.samples, scene.cycles.use_denoising = 'CPU', 32, True
try:
    scene.view_settings.view_transform = 'AgX'
except TypeError:
    pass
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'cdf-coastal55.blend'))
manifest['render_engine_requested'] = 'Cycles CPU 32 samples'
try:
    bpy.ops.render.render(write_still=True)
    manifest['render_status'] = 'CREATED'
except Exception as exc:
    manifest['cycles_error'] = str(exc)
    manifest['render_status'] = 'FAILED'
    for engine in ['BLENDER_EEVEE', 'BLENDER_EEVEE_NEXT']:
        try:
            scene.render.engine = engine
            bpy.ops.render.render(write_still=True)
            manifest['render_status'], manifest['render_engine_fallback'] = 'CREATED', engine
            break
        except Exception:
            continue
(OUT/'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')
print('CDF_MODEL55_RESULT '+json.dumps(manifest))
