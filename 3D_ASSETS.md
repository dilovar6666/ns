# 3D assets

| Asset | Source | Attribution/license | Status |
|---|---|---|---|
| Astronaut suit GLB | User-supplied `animated-floating-astronaut-in-space-suit-loop.zip` | Not included in archive; must be verified | Local demo only |
| Anatomy systems | None supplied | Requires sourced licenses | Not implemented |

The archive and extracted source remain untouched. Run `node scripts/convert-astronaut-materials.mjs` to generate `frontend/public/models/astronaut.glb` for the local viewer. The conversion maps the original diffuse textures and material colors to standard glTF metallic/roughness materials and preserves the source normal maps, geometry, skin, and animations. Its 46.6 MB size is a mobile performance risk. Do not publish it until ownership and reuse rights are confirmed. No medical accuracy claim is made.

The model's glTF metadata includes four animations and one skin. The generated viewer asset removes the unsupported `KHR_materials_pbrSpecularGlossiness` extension so Three.js displays the suit's original color textures.
