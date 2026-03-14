import { Vector3 } from 'three'

// 坐标类型
export type ChunkCoord = { x: number; z: number }
export type BlockCoord = { x: number; y: number; z: number }
export type WorldPos = Vector3

// 射线检测结果
export interface RaycastResult {
  hit: boolean
  position: Vector3 | null
  normal: Vector3 | null
  blockId: number | null
  distance: number
}

// 碰撞结果
export interface CollisionResult {
  isColliding: boolean
  normal: Vector3 | null
  penetration: number
}

// 游戏配置
export interface GameOptions {
  renderDistance: number
  worldSize: number
  seed: number
  sensitivity: number
  invertY: boolean
}

// 玩家输入
export interface PlayerInput {
  forward: boolean
  backward: boolean
  left: boolean
  right: boolean
  jump: boolean
  sprint: boolean
}

// 物品栏槽位
export interface InventorySlot {
  blockId: number
  count: number
}
