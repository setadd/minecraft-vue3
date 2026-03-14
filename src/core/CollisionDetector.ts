import * as THREE from 'three'
import type { ChunkManager } from './ChunkManager'
import { GAME_CONFIG } from '@/constants/config'

export interface AABB {
  min: THREE.Vector3
  max: THREE.Vector3
}

export interface CollisionResult {
  isColliding: boolean
  normal: THREE.Vector3 | null
  penetration: number
}

export class CollisionDetector {
  private chunkManager: ChunkManager

  private readonly PLAYER_WIDTH = GAME_CONFIG.PLAYER_WIDTH
  private readonly PLAYER_HEIGHT = GAME_CONFIG.PLAYER_HEIGHT

  constructor(chunkManager: ChunkManager) {
    this.chunkManager = chunkManager
  }

  // 创建玩家 AABB
  createPlayerAABB(position: THREE.Vector3): AABB {
    const halfWidth = this.PLAYER_WIDTH / 2
    return {
      min: new THREE.Vector3(
        position.x - halfWidth,
        position.y - this.PLAYER_HEIGHT,
        position.z - halfWidth
      ),
      max: new THREE.Vector3(
        position.x + halfWidth,
        position.y,
        position.z + halfWidth
      ),
    }
  }

  // 创建方块 AABB
  createBlockAABB(x: number, y: number, z: number): AABB {
    return {
      min: new THREE.Vector3(x, y, z),
      max: new THREE.Vector3(x + 1, y + 1, z + 1),
    }
  }

  // 检测两个 AABB 是否相交
  testAABBIntersection(a: AABB, b: AABB): boolean {
    return a.min.x < b.max.x && a.max.x > b.min.x &&
           a.min.y < b.max.y && a.max.y > b.min.y &&
           a.min.z < b.max.z && a.max.z > b.min.z
  }

  // 获取玩家周围的方块
  private getSurroundingBlocks(position: THREE.Vector3): Array<{ x: number; y: number; z: number; blockId: number }> {
    const blocks: Array<{ x: number; y: number; z: number; blockId: number }> = []
    const playerAABB = this.createPlayerAABB(position)

    // 获取玩家周围的方块范围
    const minX = Math.floor(playerAABB.min.x) - 1
    const maxX = Math.floor(playerAABB.max.x) + 1
    const minY = Math.floor(playerAABB.min.y) - 1
    const maxY = Math.floor(playerAABB.max.y) + 1
    const minZ = Math.floor(playerAABB.min.z) - 1
    const maxZ = Math.floor(playerAABB.max.z) + 1

    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        for (let z = minZ; z <= maxZ; z++) {
          const blockId = this.chunkManager.getBlock(x, y, z)
          if (blockId !== 0) {
            blocks.push({ x, y, z, blockId })
          }
        }
      }
    }

    return blocks
  }

  // 检测玩家位置是否安全
  checkCollision(position: THREE.Vector3): CollisionResult {
    const playerAABB = this.createPlayerAABB(position)
    const blocks = this.getSurroundingBlocks(position)

    for (const block of blocks) {
      const blockAABB = this.createBlockAABB(block.x, block.y, block.z)
      if (this.testAABBIntersection(playerAABB, blockAABB)) {
        // 计算穿透深度
        const penetration = this.calculatePenetration(playerAABB, blockAABB)
        const normal = this.calculateNormal(playerAABB, blockAABB)

        return {
          isColliding: true,
          normal,
          penetration,
        }
      }
    }

    return {
      isColliding: false,
      normal: null,
      penetration: 0,
    }
  }

  // 计算穿透深度
  private calculatePenetration(player: AABB, block: AABB): number {
    const dx = Math.min(player.max.x - block.min.x, block.max.x - player.min.x)
    const dy = Math.min(player.max.y - block.min.y, block.max.y - player.min.y)
    const dz = Math.min(player.max.z - block.min.z, block.max.z - player.min.z)
    return Math.min(dx, dy, dz)
  }

  // 计算碰撞法线
  private calculateNormal(player: AABB, block: AABB): THREE.Vector3 {
    const dx = Math.min(player.max.x - block.min.x, block.max.x - player.min.x)
    const dy = Math.min(player.max.y - block.min.y, block.max.y - player.min.y)
    const dz = Math.min(player.max.z - block.min.z, block.max.z - player.min.z)

    if (dx < dy && dx < dz) {
      // X 方向碰撞
      return new THREE.Vector3(player.max.x < block.min.x + 0.5 ? 1 : -1, 0, 0)
    } else if (dy < dz) {
      // Y 方向碰撞
      return new THREE.Vector3(0, player.max.y < block.min.y + 0.5 ? 1 : -1, 0)
    } else {
      // Z 方向碰撞
      return new THREE.Vector3(0, 0, player.max.z < block.min.z + 0.5 ? 1 : -1)
    }
  }

  // 获取碰撞后的安全位置
  getSafePosition(position: THREE.Vector3): THREE.Vector3 {
    const collision = this.checkCollision(position)
    if (!collision.isColliding) {
      return position.clone()
    }

    // 尝试向上移动找到安全位置
    const safePos = position.clone()
    for (let i = 0; i < 3; i++) {
      safePos.y += 0.5
      const check = this.checkCollision(safePos)
      if (!check.isColliding) {
        return safePos
      }
    }

    // 如果向上不行，尝试水平移动
    const offsets = [
      { x: 0.5, z: 0 }, { x: -0.5, z: 0 },
      { x: 0, z: 0.5 }, { x: 0, z: -0.5 },
    ]

    for (const offset of offsets) {
      safePos.x = position.x + offset.x
      safePos.z = position.z + offset.z
      safePos.y = position.y
      const check = this.checkCollision(safePos)
      if (!check.isColliding) {
        return safePos
      }
    }

    return position
  }

  // 检测脚下是否有方块
  isOnGround(position: THREE.Vector3): boolean {
    const footY = position.y - this.PLAYER_HEIGHT
    // 检测脚下紧邻的方块（向下 1 个单位）
    const blockBelow = this.chunkManager.getBlock(
      Math.floor(position.x),
      Math.floor(footY),
      Math.floor(position.z)
    )
    return blockBelow !== 0
  }

  // 获取地面高度（指定 XZ 位置的最高方块）
  getGroundHeight(x: number, z: number, maxY: number): number {
    for (let y = Math.floor(maxY); y >= 0; y--) {
      const blockId = this.chunkManager.getBlock(Math.floor(x), y, Math.floor(z))
      if (blockId !== 0) {
        return y + 1 // 返回方块顶部
      }
    }
    return 0 // 没有方块
  }
}
