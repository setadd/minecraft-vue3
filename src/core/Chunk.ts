import * as THREE from 'three'
import { GAME_CONFIG } from '@/constants/config'
import type { BlockData } from '@/types/world'
import { isBlockSolid } from '@/constants/blocks'

export class Chunk {
  public x: number
  public z: number
  public blocks: BlockData
  public isDirty: boolean
  public modified: boolean

  private meshes: THREE.InstancedMesh[] = []
  private static readonly SIZE = GAME_CONFIG.CHUNK_SIZE
  private static readonly HEIGHT = GAME_CONFIG.CHUNK_HEIGHT
  private static readonly boxGeometry = new THREE.BoxGeometry(1, 1, 1)

  constructor(x: number, z: number, blocks?: BlockData) {
    this.x = x
    this.z = z
    this.blocks = blocks || new Uint8Array(Chunk.SIZE * Chunk.HEIGHT * Chunk.SIZE)
    this.isDirty = true
    this.modified = false
  }

  // 获取方块 ID
  getBlock(localX: number, localY: number, localZ: number): number {
    if (localX < 0 || localX >= Chunk.SIZE ||
        localY < 0 || localY >= Chunk.HEIGHT ||
        localZ < 0 || localZ >= Chunk.SIZE) {
      return 0
    }
    const index = this.calculateIndex(localX, localY, localZ)
    return this.blocks[index]
  }

  // 设置方块 ID
  setBlock(localX: number, localY: number, localZ: number, blockId: number): void {
    if (localX < 0 || localX >= Chunk.SIZE ||
        localY < 0 || localY >= Chunk.HEIGHT ||
        localZ < 0 || localZ >= Chunk.SIZE) {
      return
    }
    const index = this.calculateIndex(localX, localY, localZ)
    this.blocks[index] = blockId
    this.isDirty = true
    this.modified = true
  }

  // 计算区块内索引
  private calculateIndex(x: number, y: number, z: number): number {
    return (y * Chunk.SIZE + z) * Chunk.SIZE + x
  }

  // 世界坐标转局部坐标
  worldToLocal(worldX: number, worldY: number, worldZ: number): THREE.Vector3 {
    return new THREE.Vector3(
      worldX - this.x * Chunk.SIZE,
      worldY,
      worldZ - this.z * Chunk.SIZE
    )
  }

  // 局部坐标转世界坐标
  localToWorld(localX: number, localY: number, localZ: number): THREE.Vector3 {
    return new THREE.Vector3(
      this.x * Chunk.SIZE + localX,
      localY,
      this.z * Chunk.SIZE + localZ
    )
  }

  // 构建网格（简化版，Phase 2 实现贪婪网格算法）
  buildMesh(scene: THREE.Scene, materials: Map<number, THREE.MeshLambertMaterial>): void {
    if (!this.isDirty) return

    // 清理旧网格
    this.disposeMeshes(scene)

    // 统计每种方块的数量
    const blockCounts = new Map<number, number>()
    const blockPositions = new Map<number, Array<{ x: number; y: number; z: number }>>()

    for (let y = 0; y < Chunk.HEIGHT; y++) {
      for (let z = 0; z < Chunk.SIZE; z++) {
        for (let x = 0; x < Chunk.SIZE; x++) {
          const blockId = this.getBlock(x, y, z)
          if (blockId !== 0 && isBlockSolid(blockId)) {
            // 只渲染可见方块（至少有一个面暴露）
            if (this.isBlockVisible(x, y, z)) {
              const count = blockCounts.get(blockId) || 0
              blockCounts.set(blockId, count + 1)

              if (!blockPositions.has(blockId)) {
                blockPositions.set(blockId, [])
              }
              blockPositions.get(blockId)!.push({ x, y, z })
            }
          }
        }
      }
    }

    // 为每种方块创建 InstancedMesh
    for (const [blockId, positions] of blockPositions.entries()) {
      const material = materials.get(blockId)
      if (!material) continue

      const instanceCount = positions.length
      const mesh = new THREE.InstancedMesh(Chunk.boxGeometry, material, instanceCount)

      const matrix = new THREE.Matrix4()
      const offset = new THREE.Vector3(this.x * Chunk.SIZE, 0, this.z * Chunk.SIZE)

      positions.forEach((pos, i) => {
        matrix.setPosition(pos.x + offset.x, pos.y, pos.z + offset.z)
        mesh.setMatrixAt(i, matrix)
      })

      mesh.instanceMatrix.needsUpdate = true
      scene.add(mesh)
      this.meshes.push(mesh)
    }

    this.isDirty = false
  }

  // 清理网格
  private disposeMeshes(scene: THREE.Scene): void {
    for (const mesh of this.meshes) {
      scene.remove(mesh)
      mesh.geometry.dispose()
    }
    this.meshes = []
  }

  // 检查方块是否可见（至少有一个面暴露）
  private isBlockVisible(x: number, y: number, z: number): boolean {
    const currentBlockId = this.getBlock(x, y, z)
    const isCurrentTransparent = this.isTransparent(currentBlockId)

    // 检查 6 个相邻方块
    const neighbors = [
      { x: x + 1, y, z }, { x: x - 1, y, z },
      { x, y: y + 1, z }, { x, y: y - 1, z },
      { x, y, z: z + 1 }, { x, y, z: z - 1 },
    ]

    for (const neighbor of neighbors) {
      if (neighbor.x < 0 || neighbor.x >= Chunk.SIZE ||
          neighbor.z < 0 || neighbor.z >= Chunk.SIZE ||
          neighbor.y < 0 || neighbor.y >= Chunk.HEIGHT) {
        return true // 区块边界，视为可见
      }
      const neighborBlockId = this.getBlock(neighbor.x, neighbor.y, neighbor.z)
      if (neighborBlockId === 0) {
        return true // 相邻方块是空气，可见
      }
      // 透明方块需要特殊处理
      if (isCurrentTransparent && !this.isTransparent(neighborBlockId)) {
        // 透明方块被实体方块包围，不渲染（除非相邻方块是空气）
        continue
      }
      if (this.isTransparent(neighborBlockId)) {
        return true // 相邻方块是透明的，当前方块可见
      }
    }

    return false
  }

  // 检查方块是否透明
  private isTransparent(blockId: number): boolean {
    // 透明方块列表
    const transparentBlocks = [5, 7] // leaves, glass
    return transparentBlocks.includes(blockId)
  }

  // 资源清理
  dispose(): void {
    this.blocks = new Uint8Array(0)
  }

  // 清理网格（从场景移除）
  disposeFromScene(scene: THREE.Scene): void {
    this.disposeMeshes(scene)
  }
}
