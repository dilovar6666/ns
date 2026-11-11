import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const sourcePath = resolve(root, 'astronaut-source/source/Walking astronaut.glb')
const outputPath = resolve(root, 'frontend/public/models/astronaut.glb')
const source = readFileSync(sourcePath)

if (source.toString('ascii', 0, 4) !== 'glTF' || source.readUInt32LE(4) !== 2) {
  throw new Error('Expected a glTF 2.0 binary file')
}

const chunks = []
for (let offset = 12; offset < source.length;) {
  const length = source.readUInt32LE(offset)
  const type = source.readUInt32LE(offset + 4)
  chunks.push({ type, data: source.subarray(offset + 8, offset + 8 + length) })
  offset += 8 + length
}

const jsonChunk = chunks.find((chunk) => chunk.type === 0x4e4f534a)
if (!jsonChunk) throw new Error('GLB has no JSON chunk')
const gltf = JSON.parse(jsonChunk.data.toString('utf8'))
const extension = 'KHR_materials_pbrSpecularGlossiness'

let converted = 0
for (const material of gltf.materials ?? []) {
  const specGloss = material.extensions?.[extension]
  if (!specGloss) continue

  // The source has diffuse textures and normal/occlusion maps, but no PBR
  // base-color maps. Three.js ignores this older material extension entirely.
  material.pbrMetallicRoughness = {
    baseColorFactor: specGloss.diffuseFactor ?? [1, 1, 1, 1],
    ...(specGloss.diffuseTexture && { baseColorTexture: specGloss.diffuseTexture }),
    metallicFactor: 0,
    roughnessFactor: specGloss.diffuseTexture ? 0.82 : 0.55,
  }
  delete material.extensions[extension]
  if (Object.keys(material.extensions).length === 0) delete material.extensions
  converted++
}

if (converted !== 3) throw new Error(`Expected to convert 3 materials, found ${converted}`)
gltf.extensionsUsed = (gltf.extensionsUsed ?? []).filter((name) => name !== extension)
gltf.extensionsRequired = (gltf.extensionsRequired ?? []).filter((name) => name !== extension)
if (gltf.extensionsUsed.length === 0) delete gltf.extensionsUsed
if (gltf.extensionsRequired.length === 0) delete gltf.extensionsRequired

const json = Buffer.from(JSON.stringify(gltf), 'utf8')
const paddedJson = Buffer.concat([json, Buffer.alloc((4 - json.length % 4) % 4, 0x20)])
chunks.find((chunk) => chunk.type === 0x4e4f534a).data = paddedJson
const output = Buffer.alloc(12 + chunks.reduce((size, chunk) => size + 8 + chunk.data.length, 0))
source.copy(output, 0, 0, 8)
output.writeUInt32LE(output.length, 8)
let offset = 12
for (const chunk of chunks) {
  output.writeUInt32LE(chunk.data.length, offset)
  output.writeUInt32LE(chunk.type, offset + 4)
  chunk.data.copy(output, offset + 8)
  offset += 8 + chunk.data.length
}
writeFileSync(outputPath, output)
console.log(`Converted ${converted} astronaut materials: ${outputPath}`)
