import * as THREE from 'three'
import { BLOCKS, isBlockTransparent } from '@/constants/blocks'
import { getTextureManager } from './TextureManager'

// 方块纹理映射（简化为单一主纹理）
const BLOCK_TEXTURES: Record<number, string> = {
  0: '', // air
  1: 'grass_top', // grass - 使用顶部纹理
  2: 'dirt', // dirt
  3: 'stone', // stone
  4: 'wood_side', // wood
  5: 'leaves', // leaves
  6: 'sand', // sand
  7: 'glass', // glass
  8: 'brick', // brick
  9: 'coal_ore', // coal_ore
  10: 'bedrock', // bedrock
}

// 创建方块材质（使用纹理）
export function createBlockMaterials(): Map<number, THREE.MeshLambertMaterial> {
  const materials = new Map<number, THREE.MeshLambertMaterial>()
  const textureManager = getTextureManager()

  for (const [blockId] of Object.entries(BLOCKS)) {
    const id = parseInt(blockId)
    if (id === 0) continue // 跳过空气

    const textureName = BLOCK_TEXTURES[id]
    if (!textureName) continue

    const texture = textureManager.getTexture(textureName)
    if (!texture) continue

    materials.set(
      id,
      new THREE.MeshLambertMaterial({
        map: texture,
        transparent: isBlockTransparent(id),
        opacity: isBlockTransparent(id) ? 0.8 : 1,
      })
    )
  }

  return materials
}

// 获取单个方块材质（用于 UI 等）
export function getBlockMaterial(blockId: number): THREE.MeshLambertMaterial | null {
  const textureManager = getTextureManager()
  const textureName = BLOCK_TEXTURES[blockId]

  if (!textureName) return null

  const texture = textureManager.getTexture(textureName)
  if (!texture) return null

  return new THREE.MeshLambertMaterial({
    map: texture,
    transparent: isBlockTransparent(blockId),
    opacity: isBlockTransparent(blockId) ? 0.8 : 1,
  })
}
