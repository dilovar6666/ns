"""Inspect the supplied GLB in Blender without changing it."""

import bpy


bpy.ops.import_scene.gltf(filepath="astronaut-source/source/Walking astronaut.glb")
print("COSMO_AUDIT objects", [(obj.name, obj.type) for obj in bpy.data.objects])
print("COSMO_AUDIT meshes", [(mesh.name, len(mesh.polygons), len(mesh.vertices)) for mesh in bpy.data.meshes])
print("COSMO_AUDIT materials", [material.name for material in bpy.data.materials])
print("COSMO_AUDIT collections", [collection.name for collection in bpy.data.collections])
print("COSMO_AUDIT actions", [action.name for action in bpy.data.actions])
