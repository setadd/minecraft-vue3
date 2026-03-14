import { Chunk } from './Chunk'
import { GAME_CONFIG } from '@/constants/config'
import { worldToChunk, worldToChunkLocal } from '@/utils/math'
import * as THREE from 'three'
import type { WorldGenerator } from './WorldGenerator'

export interface RaycastResult {
  hit: boolean
  position: THREE.Vector3 | null    // 击中点世界坐标
  normal: THREE.Vector3 | null      // 击中面法线
  blockId: number                   // 击中的方块 ID
  x: number                         // 方块世界坐标 X
  y: number                         // 方块世界坐标 Y
  z: number                         // 方块世界坐标 Z
}

export class ChunkManager {
  private chunks: Map<string, Chunk> = new Map()
  private renderDistance: number
  private readonly MAX_DISTANCE: number = GAME_CONFIG.REACH_DISTANCE
  private worldGenerator: WorldGenerator | null = null

  constructor(
    renderDistance: number = GAME_CONFIG.DEFAULT_RENDER_DISTANCE,
    worldGenerator?: WorldGenerator
  ) {
    this.renderDistance = renderDistance
    this.worldGenerator = worldGenerator || null
  }

  // 获取所有区块（用于保存）
  getAllChunks(): Map<string, Chunk> {
    return this.chunks
  }

  // 生成区块键
  private getChunkKey(x: number, z: number): string {
    return `${x},${z}`
  }

  // 获取区块
  getChunk(chunkX: number, chunkZ: number): Chunk | null {
    const key = this.getChunkKey(chunkX, chunkZ)
    return this.chunks.get(key) || null
  }

  // 获取方块（世界坐标）
  getBlock(worldX: number, worldY: number, worldZ: number): number {
    const { x: chunkX, z: chunkZ } = worldToChunk(worldX, worldZ)
    const localX = worldToChunkLocal(worldX)
    const localZ = worldToChunkLocal(worldZ)

    const chunk = this.getChunk(chunkX, chunkZ)
    if (!chunk) return 0

    return chunk.getBlock(localX, worldY, localZ)
  }

  // 设置方块（世界坐标）
  setBlock(worldX: number, worldY: number, worldZ: number, blockId: number): void {
    const { x: chunkX, z: chunkZ } = worldToChunk(worldX, worldZ)
    const localX = worldToChunkLocal(worldX)
    const localZ = worldToChunkLocal(worldZ)

    const chunk = this.getChunk(chunkX, chunkZ)
    if (chunk) {
      chunk.setBlock(localX, worldY, localZ, blockId)
    }
  }

  // 创建区块
  createChunk(chunkX: number, chunkZ: number): Chunk {
    const key = this.getChunkKey(chunkX, chunkZ)
    const chunk = new Chunk(chunkX, chunkZ)
    this.chunks.set(key, chunk)
    return chunk
  }

  // 卸载区块
  unloadChunk(chunkX: number, chunkZ: number): void {
    const key = this.getChunkKey(chunkX, chunkZ)
    const chunk = this.chunks.get(key)
    if (chunk) {
      chunk.dispose()
      this.chunks.delete(key)
    }
  }

  // 更新区块加载
  update(playerChunkX: number, playerChunkZ: number, scene?: THREE.Scene, materials?: Map<number, THREE.MeshLambertMaterial>): void {
    const renderDistance = this.renderDistance

    // 计算当前需要加载的区块范围
    const minX = playerChunkX - renderDistance
    const maxX = playerChunkX + renderDistance
    const minZ = playerChunkZ - renderDistance
    const maxZ = playerChunkZ + renderDistance

    // 加载范围内的区块
    for (let x = minX; x <= maxX; x++) {
      for (let z = minZ; z <= maxZ; z++) {
        const key = this.getChunkKey(x, z)
        if (!this.chunks.has(key)) {
          // 需要加载新区块
          this.loadChunk(x, z, scene, materials)
        }
      }
    }

    // 卸载范围外的区块（带缓冲区）
    const unloadDistance = renderDistance + 2
    for (const [key, chunk] of this.chunks.entries()) {
      const dx = Math.abs(chunk.x - playerChunkX)
      const dz = Math.abs(chunk.z - playerChunkZ)
      if (dx > unloadDistance || dz > unloadDistance) {
        chunk.disposeFromScene(scene!)
        this.chunks.delete(key)
      }
    }
  }

  // 加载区块
  private loadChunk(chunkX: number, chunkZ: number, scene?: THREE.Scene, materials?: Map<number, THREE.MeshLambertMaterial>): void {
    if (!this.worldGenerator || !scene || !materials) return

    const chunkData = this.worldGenerator.generateChunk(chunkX, chunkZ)
    const chunk = this.createChunk(chunkX, chunkZ)
    chunk.blocks = chunkData
    chunk.isDirty = true
    chunk.buildMesh(scene, materials)
  }

  // 清空所有区块
  clear(scene?: THREE.Scene): void {
    for (const chunk of this.chunks.values()) {
      if (scene) {
        chunk.disposeFromScene(scene)
      }
      chunk.dispose()
    }
    this.chunks.clear()
  }

  // 射线检测（DDA 算法）
  raycast(origin: THREE.Vector3, direction: THREE.Vector3, maxDistance: number = this.MAX_DISTANCE): RaycastResult {
    const result: RaycastResult = {
      hit: false,
      position: null,
      normal: null,
      blockId: 0,
      x: 0,
      y: 0,
      z: 0,
    }

    // DDA 算法参数
    const rayDirX = direction.x
    const rayDirY = direction.y
    const rayDirZ = direction.z

    // 到下一个方块边界的步长方向
    const stepX = rayDirX > 0 ? 1 : -1
    const stepY = rayDirY > 0 ? 1 : -1
    const stepZ = rayDirZ > 0 ? 1 : -1

    // 从射线起点往前移动一小段距离，避免检测起点所在的方块
    const startOffset = 0.1
    const adjustedOrigin = origin.clone().add(direction.clone().multiplyScalar(startOffset))

    // 当前方块坐标
    let currentX = Math.floor(adjustedOrigin.x)
    let currentY = Math.floor(adjustedOrigin.y)
    let currentZ = Math.floor(adjustedOrigin.z)

    // tMax - 射线到下一个方块边界的距离
    const nextBoundaryX = rayDirX > 0 ? currentX + 1 : currentX
    const nextBoundaryY = rayDirY > 0 ? currentY + 1 : currentY
    const nextBoundaryZ = rayDirZ > 0 ? currentZ + 1 : currentZ

    let tMaxX = rayDirX !== 0 ? (nextBoundaryX - adjustedOrigin.x) / rayDirX : Infinity
    let tMaxY = rayDirY !== 0 ? (nextBoundaryY - adjustedOrigin.y) / rayDirY : Infinity
    let tMaxZ = rayDirZ !== 0 ? (nextBoundaryZ - adjustedOrigin.z) / rayDirZ : Infinity

    // tDelta - 射线穿过一个方块的距离
    const tDeltaX = rayDirX !== 0 ? Math.abs(1 / rayDirX) : Infinity
    const tDeltaY = rayDirY !== 0 ? Math.abs(1 / rayDirY) : Infinity
    const tDeltaZ = rayDirZ !== 0 ? Math.abs(1 / rayDirZ) : Infinity

    let prevX = currentX
    let prevY = currentY
    let prevZ = currentZ

    for (let i = 0; i < maxDistance * 10; i++) {
      // 找到最近的边界
      if (tMaxX < tMaxY) {
        if (tMaxX < tMaxZ) {
          // X 边界最近
          currentX += stepX
          tMaxX += tDeltaX
        } else {
          // Z 边界最近
          currentZ += stepZ
          tMaxZ += tDeltaZ
        }
      } else {
        if (tMaxY < tMaxZ) {
          // Y 边界最近
          currentY += stepY
          tMaxY += tDeltaY
        } else {
          // Z 边界最近
          currentZ += stepZ
          tMaxZ += tDeltaZ
        }
      }

      // 检查距离
      const currentDist = Math.min(tMaxX, tMaxY, tMaxZ)
      if (currentDist > maxDistance) {
        break
      }

      const blockId = this.getBlock(currentX, currentY, currentZ)
      if (blockId !== 0) {
        // 击中
        result.hit = true
        result.blockId = blockId
        result.x = currentX
        result.y = currentY
        result.z = currentZ
        result.position = new THREE.Vector3(currentX, currentY, currentZ)

        // 计算法线（从哪个方向进入方块）
        if (currentX !== prevX) result.normal = new THREE.Vector3(-stepX, 0, 0)
        else if (currentY !== prevY) result.normal = new THREE.Vector3(0, -stepY, 0)
        else if (currentZ !== prevZ) result.normal = new THREE.Vector3(0, 0, -stepZ)

        return result
      }

      prevX = currentX
      prevY = currentY
      prevZ = currentZ
    }

    return result
  }
}
