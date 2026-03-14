import * as THREE from 'three'
import { GAME_CONFIG } from '@/constants/config'
import { getBlockDef, isBlockGravityAffected } from '@/constants/blocks'
import type { ChunkManager } from './ChunkManager'
import { getAudioSystem } from './AudioSystem'

interface DiggingState {
  targetBlock: { x: number; y: number; z: number }
  progress: number
  startTime: number
}

export class BlockSystem {
  private diggingState: DiggingState | null = null
  private lastActionTime: number = 0
  private readonly CLICK_THROTTLE = GAME_CONFIG.CLICK_THROTTLE
  private gravityBlockTimer: number = 0
  private readonly GRAVITY_INTERVAL = 0.1 // 重力更新间隔（秒）
  private audioSystem = getAudioSystem()
  private lastDigBlock: { x: number; y: number; z: number } | null = null
  private lastDigPosition: THREE.Vector3 | null = null // 保存最后挖掘位置

  // 更新重力方块（沙子、沙砾等）
  updateGravityBlocks(delta: number, chunkManager: ChunkManager): Set<string> {
    this.gravityBlockTimer += delta
    if (this.gravityBlockTimer < this.GRAVITY_INTERVAL) return new Set()

    this.gravityBlockTimer = 0
    const modifiedChunks = new Set<string>()

    // 获取所有加载的区块
    // 注意：这里简化处理，只检查玩家附近的区块
    // 实际游戏中应该遍历所有加载的区块
    const positions: Array<{ x: number; y: number; z: number; blockId: number }> = []

    // 收集所有需要检查的重力方块位置
    // 从下往上检查，避免重复更新
    for (let y = 1; y < GAME_CONFIG.CHUNK_HEIGHT; y++) {
      for (let x = -8; x <= 8; x++) {
        for (let z = -8; z <= 8; z++) {
          const blockId = chunkManager.getBlock(x, y, z)
          if (blockId !== 0 && isBlockGravityAffected(blockId)) {
            // 检查下方是否为空
            const belowBlock = chunkManager.getBlock(x, y - 1, z)
            if (belowBlock === 0) {
              positions.push({ x, y, z, blockId })
            }
          }
        }
      }
    }

    // 从上往下更新重力方块
    positions.sort((a, b) => b.y - a.y)
    for (const pos of positions) {
      const blockId = chunkManager.getBlock(pos.x, pos.y, pos.z)
      if (blockId !== 0 && isBlockGravityAffected(blockId)) {
        // 再次确认下方是否为空（可能已经被更新）
        const belowBlock = chunkManager.getBlock(pos.x, pos.y - 1, pos.z)
        if (belowBlock === 0) {
          // 移动方块到下方
          chunkManager.setBlock(pos.x, pos.y, pos.z, 0)
          chunkManager.setBlock(pos.x, pos.y - 1, pos.z, blockId)

          // 记录需要更新的区块
          const chunkX1 = Math.floor(pos.x / 16)
          const chunkZ1 = Math.floor(pos.z / 16)
          const chunkX2 = Math.floor(pos.x / 16)
          const chunkZ2 = Math.floor(pos.z / 16)
          modifiedChunks.add(`${chunkX1},${chunkZ1}`)
          modifiedChunks.add(`${chunkX2},${chunkZ2}`)
        }
      }
    }

    return modifiedChunks
  }

  // 开始挖掘（立即挖掘模式）
  startDigging(position: THREE.Vector3, chunkManager: ChunkManager): void {
    const now = Date.now()
    if (now - this.lastActionTime < this.CLICK_THROTTLE) {
      return
    }

    const targetX = Math.floor(position.x)
    const targetY = Math.floor(position.y)
    const targetZ = Math.floor(position.z)

    // 检查方块是否可挖掘
    const blockId = chunkManager.getBlock(targetX, targetY, targetZ)
    const blockDef = getBlockDef(blockId)

    if (blockDef.hardness === Infinity || blockDef.hardness === 0) {
      return // 不可挖掘的方块
    }

    this.lastDigPosition = new THREE.Vector3(targetX, targetY, targetZ)
    chunkManager.setBlock(targetX, targetY, targetZ, 0)
    this.audioSystem.playBreak() // 播放破坏音效
    this.lastActionTime = now
  }

  // 取消挖掘
  cancelDigging(): void {
    this.diggingState = null
  }

  // 更新挖掘进度（已废弃，立即挖掘模式）
  updateDigging(delta: number, chunkManager: ChunkManager): boolean {
    return false
  }

  // 放置方块
  placeBlock(
    position: THREE.Vector3,
    normal: THREE.Vector3,
    blockId: number,
    chunkManager: ChunkManager,
    playerPosition?: THREE.Vector3
  ): boolean {
    const now = Date.now()
    if (now - this.lastActionTime < this.CLICK_THROTTLE) {
      return false
    }

    const targetX = Math.floor(position.x + normal.x)
    const targetY = Math.floor(position.y + normal.y)
    const targetZ = Math.floor(position.z + normal.z)

    // 检查是否在玩家碰撞体内
    if (playerPosition) {
      const playerBox = new THREE.Box3()
      const playerSize = GAME_CONFIG.PLAYER_WIDTH
      playerBox.setFromCenterAndSize(
        new THREE.Vector3(
          playerPosition.x,
          playerPosition.y - GAME_CONFIG.PLAYER_HEIGHT / 2,
          playerPosition.z
        ),
        new THREE.Vector3(playerSize, GAME_CONFIG.PLAYER_HEIGHT, playerSize)
      )

      const blockBox = new THREE.Box3(
        new THREE.Vector3(targetX, targetY, targetZ),
        new THREE.Vector3(targetX + 1, targetY + 1, targetZ + 1)
      )

      if (playerBox.intersectsBox(blockBox)) {
        return false // 禁止放置在与玩家重叠的位置
      }
    }

    // 检查目标位置是否为空气
    const currentBlock = chunkManager.getBlock(targetX, targetY, targetZ)
    if (currentBlock !== 0) {
      return false
    }

    chunkManager.setBlock(targetX, targetY, targetZ, blockId)
    this.audioSystem.playPlace(blockId) // 播放放置音效
    this.lastActionTime = now
    return true
  }

  // 获取挖掘进度
  getDiggingProgress(): number {
    return this.diggingState?.progress ?? 0
  }

  // 是否正在挖掘
  isDigging(): boolean {
    return this.diggingState !== null
  }

  // 获取当前挖掘位置（包括最后一次挖掘的位置）
  getDiggingPosition(): THREE.Vector3 | null {
    if (this.diggingState) {
      return new THREE.Vector3(
        this.diggingState.targetBlock.x,
        this.diggingState.targetBlock.y,
        this.diggingState.targetBlock.z
      )
    }
    // 返回最后一次挖掘的位置
    return this.lastDigPosition
  }

  // 清除最后挖掘位置（在网格重建后调用）
  clearLastDigPosition(): void {
    this.lastDigPosition = null
  }
}
