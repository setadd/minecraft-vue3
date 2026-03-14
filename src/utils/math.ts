import { Vector3 } from 'three'
import type { ChunkCoord, BlockCoord } from '@/types'
import { GAME_CONFIG } from '@/constants/config'

const { CHUNK_SIZE } = GAME_CONFIG

// 世界坐标转区块坐标
export function worldToChunk(worldX: number, worldZ: number): ChunkCoord {
  return {
    x: Math.floor(worldX / CHUNK_SIZE),
    z: Math.floor(worldZ / CHUNK_SIZE),
  }
}

// 世界坐标转区块内局部坐标
export function worldToChunkLocal(worldX: number): number {
  return ((worldX % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE
}

// 区块坐标转世界坐标
export function chunkToWorldX(chunkX: number): number {
  return chunkX * CHUNK_SIZE
}

export function chunkToWorldZ(chunkZ: number): number {
  return chunkZ * CHUNK_SIZE
}

// 3D 区块内索引计算
export function calculateBlockIndex(x: number, y: number, z: number): number {
  return (y * CHUNK_SIZE + z) * CHUNK_SIZE + x
}

// 索引转 3D 坐标
export function indexToBlockCoords(index: number): BlockCoord {
  const y = Math.floor(index / (CHUNK_SIZE * CHUNK_SIZE))
  const remainder = index % (CHUNK_SIZE * CHUNK_SIZE)
  const z = Math.floor(remainder / CHUNK_SIZE)
  const x = remainder % CHUNK_SIZE
  return { x, y, z }
}

// 欧拉角转方向向量
export function getDirectionFromEuler(yaw: number, pitch: number): Vector3 {
  const x = Math.sin(yaw) * Math.cos(pitch)
  const y = Math.sin(pitch)
  const z = Math.cos(yaw) * Math.cos(pitch)
  return new Vector3(x, y, z).normalize()
}

// AABB 工具
export interface AABB {
  min: Vector3
  max: Vector3
}

export function createAABB(center: Vector3, width: number, height: number): AABB {
  const halfWidth = width / 2
  return {
    min: new Vector3(center.x - halfWidth, center.y, center.z - halfWidth),
    max: new Vector3(center.x + halfWidth, center.y + height, center.z + halfWidth),
  }
}

export function testAABBIntersection(a: AABB, b: AABB): boolean {
  return (
    a.min.x <= b.max.x && a.max.x >= b.min.x &&
    a.min.y <= b.max.y && a.max.y >= b.min.y &&
    a.min.z <= b.max.z && a.max.z >= b.min.z
  )
}

// 线性插值
export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t
}

// 平滑步进
export function smoothStep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}
