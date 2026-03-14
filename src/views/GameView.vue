<template>
  <div class="game-view">
    <GameCanvas ref="gameCanvas" />
    <Crosshair />
    <Hotbar />
    <PauseMenu />
    <BlockWheel ref="blockWheel" />

    <!-- 调试信息 -->
    <div v-if="store.showDebugInfo" class="debug-info">
      <div>FPS: {{ fps }}</div>
      <div>Pos: {{ playerPos?.x.toFixed(1) }}, {{ playerPos?.y.toFixed(1) }}, {{ playerPos?.z.toFixed(1) }}</div>
      <div>Chunk: {{ currentChunk?.x }}, {{ currentChunk?.z }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useGameStore } from '@/stores/game'
import GameCanvas from '@/components/game/GameCanvas.vue'
import Crosshair from '@/components/game/Crosshair.vue'
import Hotbar from '@/components/ui/Hotbar.vue'
import PauseMenu from '@/components/ui/PauseMenu.vue'
import BlockWheel from '@/components/ui/BlockWheel.vue'
import { PlayerController } from '@/core/PlayerController'
import { ChunkManager } from '@/core/ChunkManager'
import { WorldGenerator } from '@/core/WorldGenerator'
import { BlockSystem } from '@/core/BlockSystem'
import { CollisionDetector } from '@/core/CollisionDetector'
import { createBlockMaterials } from '@/core/BlockMaterials'
import { getTextureManager } from '@/core/TextureManager'
import { getAudioSystem } from '@/core/AudioSystem'
import { GAME_CONFIG } from '@/constants/config'
import * as THREE from 'three'

const store = useGameStore()
const gameCanvas = ref<InstanceType<typeof GameCanvas> | null>(null)
const blockWheel = ref<InstanceType<typeof BlockWheel> | null>(null)

let playerController: PlayerController | null = null
let chunkManager: ChunkManager | null = null
let worldGenerator: WorldGenerator | null = null
let blockSystem: BlockSystem | null = null
let collisionDetector: CollisionDetector | null = null
let animationId: number | null = null
let materials: Map<number, THREE.MeshLambertMaterial> | null = null

// 调试信息
const fps = ref(0)
const playerPos = ref<THREE.Vector3 | null>(null)
const currentChunk = ref<{ x: number; z: number } | null>(null)
let frameCount = 0
let lastFpsTime = Date.now()

const handleKeydown = (e: KeyboardEvent) => {
  // 移动按键由 PlayerController 自己处理，这里只处理 UI 相关按键

  if (e.code >= 'Digit1' && e.code <= 'Digit9') {
    const slot = parseInt(e.code.replace('Digit', '')) - 1
    store.selectSlot(slot)
  }
  if (e.code === 'KeyQ') {
    store.cycleSlot(1)
  }
  if (e.code === 'Escape') {
    store.setPlaying(false)
    playerController?.unlock()
  }
  if (e.code === 'Tab') {
    e.preventDefault()
    // 切换方块选择轮盘
    blockWheel.value?.toggleWheel()
  }
  if (e.code === 'F3') {
    e.preventDefault()
    store.showDebugInfo = !store.showDebugInfo
  }
  if (e.code === 'KeyF') {
    e.preventDefault()
    // 手动保存
    manualSave()
  }
  if (e.code === 'KeyG') {
    e.preventDefault()
    // 切换飞行模式
    playerController?.toggleFlying()
  }
}

// 手动保存
async function manualSave() {
  if (!playerController || !chunkManager) return

  const { getSaveSystem } = await import('@/core/SaveSystem')
  const saveSystem = getSaveSystem()

  const playerData = store.getPlayerSaveData(
    playerController.position,
    playerController.rotation
  )

  await saveSystem.save(playerData, chunkManager.getAllChunks())
  console.log('Game saved manually')
}

const handleMouseDown = (e: MouseEvent) => {
  if (!store.isPlaying || !playerController?.isLocked()) return

  const sceneManager = gameCanvas.value?.getSceneManager()
  if (!sceneManager) return

  const blockId = store.selectedBlockId

  // 获取视线方向
  const camera = sceneManager.getCamera()
  const direction = new THREE.Vector3()
  camera.getWorldDirection(direction)
  direction.normalize()

  // 从相机位置发射射线
  const origin = camera.position.clone()

  if (e.button === 0) {
    // 左键 - 立即挖掘
    const result = chunkManager?.raycast(origin, direction)
    if (result && result.hit) {
      blockSystem?.startDigging(new THREE.Vector3(result.x, result.y, result.z), chunkManager!)
      // 重建区块网格
      const chunkX = Math.floor(result.x / 16)
      const chunkZ = Math.floor(result.z / 16)
      const chunk = chunkManager?.getChunk(chunkX, chunkZ)
      if (chunk && materials) {
        chunk.isDirty = true
        chunk.buildMesh(sceneManager.scene, materials)
      }
    }
  } else if (e.button === 2) {
    // 右键 - 放置
    const result = chunkManager?.raycast(origin, direction)
    if (result && result.hit && result.normal) {
      const placed = blockSystem?.placeBlock(
        new THREE.Vector3(result.x, result.y, result.z),
        result.normal,
        blockId,
        chunkManager!,
        playerController?.position
      )
      if (placed) {
        // 重建区块网格
        const placeX = result.x + result.normal.x
        const placeZ = result.z + result.normal.z
        const chunkX = Math.floor(placeX / 16)
        const chunkZ = Math.floor(placeZ / 16)
        const chunk = chunkManager?.getChunk(chunkX, chunkZ)
        if (chunk) {
          chunk.isDirty = true
          chunk.buildMesh(sceneManager.scene, materials!)
        }
      }
    }
  }
}

const handleMouseUp = (e: MouseEvent) => {
  if (e.button === 0) {
    // 松开左键，取消挖掘
    blockSystem?.cancelDigging()
  }
}

const handleContextMenu = (e: Event) => {
  e.preventDefault()
}

const gameLoop = () => {
  const sceneManager = gameCanvas.value?.getSceneManager()
  if (!sceneManager) return

  const delta = sceneManager.getDelta()

  if (playerController && store.isPlaying) {
    playerController.update(delta)

    // 更新调试信息
    playerPos.value = playerController.position.clone()
    const pos = playerController.position
    currentChunk.value = {
      x: Math.floor(pos.x / 16),
      z: Math.floor(pos.z / 16),
    }
  } else {
    // 调试：输出为什么不更新
    if (!playerController) console.log('gameLoop: playerController not initialized')
    if (!store.isPlaying) console.log('gameLoop: store.isPlaying is false')
  }

  // 更新区块
  if (chunkManager && playerController && materials) {
    const pos = playerController.position
    const playerChunkX = Math.floor(pos.x / 16)
    const playerChunkZ = Math.floor(pos.z / 16)
    const sceneManager = gameCanvas.value?.getSceneManager()
    chunkManager.update(playerChunkX, playerChunkZ, sceneManager?.scene, materials)
  }

  // 更新重力方块
  if (blockSystem && chunkManager && store.isPlaying) {
    const modifiedChunks = blockSystem.updateGravityBlocks(delta, chunkManager)
    // 重建被修改的区块网格
    if (materials) {
      for (const key of modifiedChunks) {
        const [chunkX, chunkZ] = key.split(',').map(Number)
        const chunk = chunkManager.getChunk(chunkX, chunkZ)
        if (chunk) {
          chunk.isDirty = true
          chunk.buildMesh(sceneManager.scene, materials)
        }
      }
    }
  }

  sceneManager.updateFrustum()
  sceneManager.render()

  // FPS 计算
  frameCount++
  const now = Date.now()
  if (now - lastFpsTime >= 1000) {
    fps.value = frameCount
    frameCount = 0
    lastFpsTime = now
  }

  animationId = requestAnimationFrame(gameLoop)
}

onMounted(() => {
  const sceneManager = gameCanvas.value?.getSceneManager()
  console.log('GameView mounted, sceneManager:', !!sceneManager)

  if (sceneManager) {
    // 创建方块材质
    materials = createBlockMaterials()
    console.log('Materials created:', materials?.size)

    // 初始化世界生成器
    worldGenerator = new WorldGenerator(Date.now())
    console.log('World seed:', worldGenerator.getSeed())

    // 初始化区块管理器（传入世界生成器）
    chunkManager = new ChunkManager(GAME_CONFIG.DEFAULT_RENDER_DISTANCE, worldGenerator)

    // 初始化碰撞检测器
    collisionDetector = new CollisionDetector(chunkManager)

    // 计算出生点所在的区块
    const spawnChunkX = Math.floor(GAME_CONFIG.SPAWN_X / GAME_CONFIG.CHUNK_SIZE)
    const spawnChunkZ = Math.floor(GAME_CONFIG.SPAWN_Z / GAME_CONFIG.CHUNK_SIZE)

    // 生成初始区块（出生点所在区块）
    const centerChunk = worldGenerator.generateChunk(spawnChunkX, spawnChunkZ)
    const chunk = chunkManager.createChunk(spawnChunkX, spawnChunkZ)
    chunk.blocks = centerChunk

    // 构建区块网格
    chunk.buildMesh(sceneManager.scene, materials!)
    console.log('Initial chunk built:', { chunkX: spawnChunkX, chunkZ: spawnChunkZ })

    // 初始化纹理和音频系统
    getTextureManager()
    const audio = getAudioSystem()
    audio.init()

    // 计算玩家初始出生点（从高空降落到地面）
    const spawnX = GAME_CONFIG.SPAWN_X
    const spawnZ = GAME_CONFIG.SPAWN_Z
    const groundY = worldGenerator.getHeight(spawnX, spawnZ)
    const spawnY = groundY + GAME_CONFIG.SPAWN_Y_OFFSET
    console.log('=== 出生点配置 ===')
    console.log(`出生坐标：X=${spawnX}, Y=${spawnY}, Z=${spawnZ}`)
    console.log(`地面高度：${groundY}`)
    console.log(`下落距离：${spawnY - groundY}`)
    console.log(`配置值：SPAWN_X=${GAME_CONFIG.SPAWN_X}, SPAWN_Z=${GAME_CONFIG.SPAWN_Z}, SPAWN_Y_OFFSET=${GAME_CONFIG.SPAWN_Y_OFFSET}`)

    // 初始化玩家控制器（传入碰撞检测器和区块管理器）
    playerController = new PlayerController(
      sceneManager.getCamera(),
      sceneManager.getRenderer().domElement,
      collisionDetector,
      chunkManager,
      { x: spawnX, y: spawnY, z: spawnZ }
    )

    // 初始化方块系统
    blockSystem = new BlockSystem()

    // 监听鼠标事件
    const canvas = sceneManager.getRenderer().domElement
    canvas.addEventListener('mousedown', handleMouseDown)
    canvas.addEventListener('mouseup', handleMouseUp)
    canvas.addEventListener('contextmenu', handleContextMenu)

    // 设置游戏状态为进行中
    store.setPlaying(true)
    console.log('Game state set to playing')

    gameLoop()
  } else {
    console.error('SceneManager not initialized!')
  }
  document.addEventListener('keydown', handleKeydown)
  store.isLoading = false
})

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
  playerController?.dispose()
  const sceneManager = gameCanvas.value?.getSceneManager()
  if (chunkManager && sceneManager) {
    chunkManager.clear(sceneManager.scene)
  }
  document.removeEventListener('keydown', handleKeydown)
  if (sceneManager) {
    const canvas = sceneManager.getRenderer().domElement
    canvas.removeEventListener('mousedown', handleMouseDown)
    canvas.removeEventListener('mouseup', handleMouseUp)
    canvas.removeEventListener('contextmenu', handleContextMenu)
  }
})
</script>

<style scoped>
.game-view {
  width: 100%;
  height: 100%;
  position: relative;
}

.debug-info {
  position: fixed;
  top: 10px;
  left: 10px;
  color: #0f0;
  font-family: monospace;
  font-size: 14px;
  z-index: 150;
  background: rgba(0, 0, 0, 0.5);
  padding: 10px;
  border-radius: 4px;
}
</style>
