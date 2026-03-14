# Minecraft 复刻项目 - 技术实现方案

> 基于 spec.md 和 CLAUDE.md 制定
> 版本：1.0 | 创建日期：2026-03-12

---

## 1. 架构设计总览

### 1.1 系统分层架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        Presentation Layer                       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   Vue Components │  │   UI State     │  │   Input        │ │
│  │   (Game/UI)     │  │   (Pinia)      │  │   Handler      │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│                        Game Logic Layer                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   Game Loop     │  │   Block        │  │   Player        │ │
│  │   Controller    │  │   System       │  │   Controller    │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   Physics       │  │   Audio        │  │   Save         │ │
│  │   Engine        │  │   System       │  │   System       │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│                        World Layer                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   Chunk         │  │   World        │  │   Terrain      │ │
│  │   Manager       │  │   Generator    │  │   Generator    │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│                        Rendering Layer                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   Scene         │  │   Mesh         │  │   Texture      │ │
│  │   Manager       │  │   Builder      │  │   Manager      │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│                        Core Libraries                           │
│         Three.js          │        Vue 3          │   Pinia    │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 核心类关系图

```
┌──────────────────────────────────────────────────────────────────┐
│                           Game                                    │
│  - sceneManager: SceneManager                                     │
│  - chunkManager: ChunkManager                                     │
│  - playerController: PlayerController                             │
│  - blockSystem: BlockSystem                                       │
│  - audioSystem: AudioSystem                                       │
│  - saveSystem: SaveSystem                                         │
│                                                                    │
│  + init() → start() → loop() → dispose()                         │
└──────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│ SceneManager  │    │ ChunkManager  │    │ PlayerCtrl    │
│───────────────│    │───────────────│    │───────────────│
│ - scene       │    │ - chunks:Map  │    │ - camera      │
│ - camera      │    │ - renderDist  │    │ - controls    │
│ - renderer    │    │ - frustum     │    │ - velocity    │
│               │    │               │    │               │
│ + render()    │    │ + getChunk()  │    │ + update()    │
│ + resize()    │    │ + loadChunk() │    │ + jump()      │
│ + dispose()   │    │ + unload()    │    │ + collide()   │
└───────────────┘    └───────────────┘    └───────────────┘
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
           ┌───────────────┐    ┌───────────────┐
           │    Chunk      │    │ WorldGenerator│
           │───────────────│    │───────────────│
           │ - x, z        │    │ - seed        │
           │ - blocks[]    │    │ - noise       │
           │ - mesh        │    │               │
           │               │    │               │
           │ + getBlock()  │    │ + generate()  │
           │ + setBlock()  │    │ + getBiome()  │
           │ + buildMesh() │    │ + getHeight() │
           │ + dispose()   │    │               │
           └───────────────┘    └───────────────┘
```

### 1.3 数据流图

```
用户输入 ──→ InputHandler ──→ PlayerController ──→ 更新玩家位置
                                      │
                                      ▼
                              CollisionDetector ──→ 碰撞响应
                                      │
                    ┌─────────────────┼─────────────────┐
                    ▼                 ▼                 ▼
            BlockSystem        ChunkManager      PhysicsEngine
            (放置/破坏)        (区块更新)         (重力/运动)
                    │                 │                 │
                    └─────────────────┼─────────────────┘
                                      ▼
                              SceneManager ──→ Three.js 渲染
                                      │
                                      ▼
                                  屏幕输出

存档系统 ←── 定时/事件 ──← Game Loop
```

---

## 2. 核心模块详细设计

### 2.1 Game - 游戏主控制器

**文件**: `src/core/Game.ts`

```typescript
interface GameConfig {
  renderDistance: number
  worldSize: number
  seed?: number
}

class Game {
  private sceneManager: SceneManager
  private chunkManager: ChunkManager
  private playerController: PlayerController
  private blockSystem: BlockSystem
  private audioSystem: AudioSystem
  private saveSystem: SaveSystem

  private isRunning: boolean = false
  private lastTime: number = 0
  private accumulator: number = 0
  private readonly FIXED_TIME_STEP: number = 1 / 60

  constructor(config: GameConfig)

  async init(): Promise<void>
  start(): void
  private gameLoop(timestamp: number): void
  private update(delta: number): void
  private render(): void
  dispose(): void
}
```

**关键设计**:
- 使用 `requestAnimationFrame` 驱动主循环
- 固定时间步长更新物理（60Hz），可变时间步长渲染
- 优雅的资源清理机制

---

### 2.2 SceneManager - 场景管理

**文件**: `src/core/SceneManager.ts`

```typescript
class SceneManager {
  public scene: THREE.Scene
  public camera: THREE.PerspectiveCamera
  public renderer: THREE.WebGLRenderer
  private frustum: THREE.Frustum
  private clock: THREE.Clock

  constructor(container: HTMLElement)

  init(): void
  getCamera(): THREE.PerspectiveCamera
  getRenderer(): THREE.WebGLRenderer

  add(mesh: THREE.Object3D): void
  remove(mesh: THREE.Object3D): void

  updateFrustum(): void
  isVisible(position: Vector3, radius: number): boolean

  onWindowResize(): void
  dispose(): void
}
```

**关键技术点**:
- 视锥体剔除：`frustum.intersectsObject()`
- 相机层级：场景根节点 → 玩家节点 → 相机
- 渲染器配置：`antialias: true`, `powerPreference: 'high-performance'`

---

### 2.3 Chunk - 区块

**文件**: `src/core/Chunk.ts`

```typescript
type BlockData = Uint8Array  // 紧凑存储，每格 1 字节

interface ChunkData {
  x: number          // 区块世界坐标 X
  z: number          // 区块世界坐标 Z
  blocks: BlockData  // 4096 字节 (16x16x16)
  isDirty: boolean   // 是否需要重新构建网格
  modified: boolean  // 是否被玩家修改（用于存档）
}

class Chunk {
  private data: ChunkData
  private mesh: THREE.InstancedMesh | null = null
  private static readonly SIZE = 16
  private static readonly HEIGHT = 16  // 每节区块高度

  constructor(x: number, z: number, blocks?: BlockData)

  // 方块访问
  getBlock(localX: number, localY: number, localZ: number): number
  setBlock(localX: number, localY: number, localZ: number, blockId: number): void

  // 世界坐标转换
  worldToLocal(wx: number, wy: number, wz: number): Vector3
  localToWorld(lx: number, ly: number, lz: number): Vector3

  // 网格构建
  buildMesh(blockDefs: Map<number, BlockDef>): THREE.InstancedMesh | null
  updateMesh(): void

  // 资源清理
  dispose(): void
}
```

**核心优化 - 贪婪网格算法**:
```
传统方法：每个方块 = 1 个立方体 (6 面)
贪婪网格：合并相邻同种方块 → 减少 90%+ 的面数

示例：
一行 16 个石头方块
  传统：16 * 6 = 96 个面
  贪婪：1 * 6 = 6 个面（合并为 16x1x1 长方体）
```

---

### 2.4 ChunkManager - 区块管理器

**文件**: `src/core/ChunkManager.ts`

```typescript
interface ChunkKey {
  x: number
  z: number
}

class ChunkManager {
  private chunks: Map<string, Chunk> = new Map()
  private pendingUpdates: Set<string> = new Set()
  private renderDistance: number

  private worldGenerator: WorldGenerator
  private sceneManager: SceneManager

  constructor(renderDistance: number, worldGenerator: WorldGenerator)

  // 区块生命周期
  update(playerChunkX: number, playerChunkZ: number): void
  private loadChunksAround(centerX: number, centerZ: number): void
  private unloadFarChunks(keepCenterX: number, keepCenterZ: number): void

  // 区块访问
  getChunk(chunkX: number, chunkZ: number): Chunk | null
  getBlock(worldX: number, worldY: number, worldZ: number): number
  setBlock(worldX: number, worldY: number, worldZ: number, blockId: number): void

  // 射线检测
  raycast(origin: Vector3, direction: Vector3, maxDist: number): RaycastResult | null

  // 存档相关
  getModifiedChunks(): Iterator<Chunk>

  dispose(): void
}
```

**区块加载策略**:
```
1. 计算玩家所在区块 (playerChunkX, playerChunkZ)
2. 加载渲染距离内的所有区块
3. 使用曼哈顿距离排序，优先加载近的
4. 每帧最多加载 N 个区块（避免卡顿）
5. 卸载距离 > renderDistance + 2 的区块
```

---

### 2.5 WorldGenerator - 世界生成器

**文件**: `src/core/WorldGenerator.ts`

```typescript
import { ImprovedNoise } from 'three'

interface BiomeConfig {
  name: string
  minHeight: number
  maxHeight: number
  surfaceBlock: number
  subsurfaceBlock: number
  probability: number
}

class WorldGenerator {
  private seed: number
  private terrainNoise: ImprovedNoise
  private biomeNoise: ImprovedNoise

  private static readonly BIOMES: BiomeConfig[] = [
    { name: 'plains', minHeight: 60, maxHeight: 70, surfaceBlock: 1, subsurfaceBlock: 2, probability: 0.4 },
    { name: 'mountains', minHeight: 80, maxHeight: 120, surfaceBlock: 3, subsurfaceBlock: 3, probability: 0.3 },
    { name: 'ocean', minHeight: 50, maxHeight: 60, surfaceBlock: 6, subsurfaceBlock: 2, probability: 0.3 },
  ]

  constructor(seed: number)

  generateChunk(chunkX: number, chunkZ: number): Uint8Array

  private getHeight(worldX: number, worldZ: number): number
  private getBiome(worldX: number, worldZ: number): BiomeConfig
  private getBlockAt(worldX: number, worldY: number, worldZ: number, biome: BiomeConfig): number
}
```

**地形生成算法**:
```typescript
// 1. 高度图：两层噪声叠加
height = baseHeight + amplitude1 * noise1(x, z) + amplitude2 * noise2(x, z)

// 2. 生物群系：2D 噪声 + 阈值
biomeNoise = noise(x / scale, z / scale)
if biomeNoise < 0.4 → plains
else if biomeNoise < 0.7 → mountains
else → ocean

// 3. 方块放置
if y < height - 4 → subsurface block
else if y === height → surface block (grass/sand/stone)
else if y <= SEA_LEVEL → air (water later)
else → air
```

---

### 2.6 PlayerController - 玩家控制器

**文件**: `src/core/PlayerController.ts`

```typescript
interface PlayerState {
  position: Vector3
  velocity: Vector3
  rotation: { x: number, y: number }  // 欧拉角
  onGround: boolean
  isFlying: boolean
}

interface PlayerInput {
  forward: boolean
  backward: boolean
  left: boolean
  right: boolean
  jump: boolean
  sprint: boolean
}

class PlayerController {
  private state: PlayerState
  private input: PlayerInput = { forward: false, ... }
  private controls: PointerLockControls

  private readonly GRAVITY = 20
  private readonly WALK_SPEED = 4.3
  private readonly JUMP_FORCE = 8
  private readonly PLAYER_HEIGHT = 1.8
  private readonly PLAYER_WIDTH = 0.6

  constructor(camera: THREE.Camera, collisionDetector: CollisionDetector)

  // 输入处理
  bindInputEvents(canvas: HTMLElement): void
  private onMouseMove(event: MouseEvent): void
  private onKeyDown(event: KeyboardEvent): void
  private onKeyUp(event: KeyboardEvent): void

  // 更新循环
  update(delta: number): void
  private handleMovement(delta: number): void
  private handleGravity(delta: number): void
  private handleJump(): void

  // 碰撞
  checkCollision(newPosition: Vector3): CollisionResult
  resolveCollision(): void

  // 状态获取
  getPosition(): Vector3
  getCamera(): THREE.Camera
  getEyePosition(): Vector3
  getViewDirection(): Vector3
}
```

**碰撞检测策略**:
```
玩家碰撞体：AABB 包围盒 (0.6 x 1.8 x 0.6)

检测步骤：
1. 计算目标位置 = 当前位置 + 速度 * 时间
2. 获取目标位置的 AABB
3. 查询 AABB 内的所有方块
4. 检测 AABB 与方块的相交
5. 如有碰撞，滑动到最近的可通行位置
6. 如卡住，向上弹出到安全位置
```

---

### 2.7 BlockSystem - 方块系统

**文件**: `src/core/BlockSystem.ts`

```typescript
interface BlockDef {
  id: number
  name: string
  texture: string | string[]
  transparent: boolean
  solid: boolean
  gravityAffected: boolean
  hardness: number
  digTime: number  // 挖掘时间（秒）
}

interface DiggingState {
  targetBlock: { x: number, y: number, z: number }
  progress: number  // 0-1
  startTime: number
}

class BlockSystem {
  private blockDefs: Map<number, BlockDef> = new Map()
  private diggingState: DiggingState | null = null
  private lastActionTime: number = 0
  private readonly CLICK_THROTTLE = 100

  constructor()

  // 方块定义
  registerBlock(def: BlockDef): void
  getBlockDef(id: number): BlockDef | undefined

  // 交互
  startDigging(position: Vector3): void
  cancelDigging(): void
  updateDigging(delta: number, chunkManager: ChunkManager): boolean  // 返回是否完成挖掘
  placeBlock(position: Vector3, blockId: number, face: Vector3): boolean

  // 工具系统（预留）
  getDigSpeed(blockId: number, toolId?: number): number

  // 物理更新
  updateGravity(chunkManager: ChunkManager): void
}
```

**挖掘进度**:
```
进度条显示 = 当前进度 / 方块硬度
完成挖掘: 进度 >= 1.0
```

---

### 2.8 CollisionDetector - 碰撞检测

**文件**: `src/core/CollisionDetector.ts`

```typescript
interface AABB {
  min: Vector3
  max: Vector3
  intersects(other: AABB): boolean
  expand(direction: Vector3, amount: number): AABB
}

class CollisionDetector {
  private chunkManager: ChunkManager

  constructor(chunkManager: ChunkManager)

  // 方块碰撞检测
  getBlockAABB(x: number, y: number, z: number): AABB | null

  // 玩家碰撞
  checkPlayerCollision(position: Vector3, height: number, width: number): CollisionResult

  // 射线检测
  raycastBlocks(origin: Vector3, direction: Vector3, maxDist: number): RaycastResult | null

  // 安全位置检测
  findSafePosition(near: Vector3): Vector3 | null
}
```

---

### 2.9 AudioSystem - 音效系统

**文件**: `src/systems/AudioSystem.ts`

```typescript
interface SoundDef {
  name: string
  path: string
  volume?: number
  pitch?: number
}

class AudioSystem {
  private listener: THREE.AudioListener
  private sounds: Map<string, THREE.Audio> = new Map()
  private loadedSounds: Map<string, AudioBuffer> = new Map()

  private stepSoundTimer: number = 0
  private lastStepPosition: Vector3 | null = null

  constructor()

  async loadSounds(sounds: SoundDef[]): Promise<void>

  play(name: string, position?: Vector3, options?: PlayOptions): void
  playStepSound(blockType: number, position: Vector3): void
  playDigSound(blockType: number): void
  playPlaceSound(blockType: number): void

  setMasterVolume(volume: number): void
  dispose(): void
}
```

---

### 2.10 SaveSystem - 存档系统

**文件**: `src/systems/SaveSystem.ts`

```typescript
import { get, set, del } from 'idb-keyval'

interface SaveData {
  version: number
  worldSeed: number
  worldName: string
  playerPosition: [number, number, number]
  playerRotation: [number, number]
  inventory: Array<{ slot: number, blockId: number, count: number }>
  modifiedChunks: Array<{
    x: number
    z: number
    blocks: number[]  // 稀疏存储，仅非空气方块
  }>
  timestamp: number
}

class SaveSystem {
  private static readonly SAVE_KEY = 'minecraft-save'
  private static readonly VERSION = 1

  async save(data: SaveData): Promise<void>
  async load(): Promise<SaveData | null>
  async delete(): Promise<void>
  async exists(): Promise<boolean>

  // 数据序列化
  private serializeChunkData(chunk: Chunk): object
  private deserializeChunkData(data: object, chunk: Chunk): void
}
```

**存档优化**:
```
仅存储：
1. 玩家数据（位置、旋转、物品栏）
2. 被修改过的区块（相对原始生成的差异）

不存储：
1. 未修改的区块（由种子重新生成）
2. 临时状态（挖掘进度等）
```

---

## 3. Vue 组件设计

### 3.1 组件树结构

```
App.vue
├── GameView.vue
│   ├── GameCanvas.vue          # Three.js 画布
│   ├── Crosshair.vue           # 准星
│   ├── BlockHighlight.vue      # 方块选中高亮
│   └── DigProgress.vue         # 挖掘进度条
├── UIOverlay.vue
│   ├── Hotbar.vue              # 快捷栏
│   ├── BlockWheel.vue          # 方块选择轮盘
│   ├── PauseMenu.vue           # 暂停菜单
│   └── DebugOverlay.vue        # 调试信息
└── LoadingScreen.vue           # 加载界面
```

### 3.2 Pinia Store 设计

**文件**: `src/stores/game.ts`

```typescript
interface GameState {
  // 游戏状态
  isPlaying: boolean
  isPaused: boolean
  isLoading: boolean

  // 玩家状态
  selectedSlot: number  // 0-8
  inventory: Array<{
    blockId: number
    count: number
  }>

  // 设置
  renderDistance: number
  sensitivity: number
  invertY: boolean

  // 调试
  showDebugInfo: boolean
}

export const useGameStore = defineStore('game', {
  state: (): GameState => ({
    isPlaying: false,
    isPaused: true,
    isLoading: true,
    selectedSlot: 0,
    inventory: Array(9).fill({ blockId: 0, count: 0 }),
    renderDistance: 6,
    sensitivity: 1.0,
    invertY: false,
    showDebugInfo: false,
  }),

  getters: {
    selectedBlockId: (state) => state.inventory[state.selectedSlot]?.blockId ?? 0,
    canInteract: (state) => state.isPlaying && !state.isPaused,
  },

  actions: {
    setPlaying(playing: boolean) { ... },
    togglePause() { ... },
    selectSlot(slot: number) { ... },
    setSelectedBlock(blockId: number) { ... },
    cycleSlot(direction: number) { ... },
  },
})
```

---

## 4. 类型定义

### 4.1 核心类型

**文件**: `src/types/index.ts`

```typescript
import { Vector3 } from 'three'

// 世界相关
export type ChunkCoord = { x: number, z: number }
export type BlockCoord = { x: number, y: number, z: number }
export type WorldPos = Vector3

// 射线检测
export interface RaycastResult {
  hit: true
  position: Vector3      // 击中点世界坐标
  normal: Vector3        // 击中面法线
  blockId: number        // 击中的方块 ID
  chunkX: number         // 所在区块 X
  chunkZ: number         // 所在区块 Z
  localX: number         // 区块内 X
  localY: number         // 区块内 Y
  localZ: number         // 区块内 Z
}

// 碰撞检测
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
```

---

## 5. 工具函数

### 5.1 数学工具

**文件**: `src/utils/math.ts`

```typescript
// 坐标转换
export function worldToChunk(worldX: number, worldZ: number): { chunkX: number, chunkZ: number }
export function worldToChunkLocal(worldX: number): number  // 0-15
export function chunkToWorld(chunkX: number): number

// 方块索引
export function calculateBlockIndex(x: number, y: number, z: number): number
export function indexToBlockCoords(index: number): { x: number, y: number, z: number }

// 方向工具
export function faceToNormal(face: Vector3): Vector3
export function getDirectionFromEuler(yaw: number, pitch: number): Vector3

// AABB 工具
export function createAABB(center: Vector3, width: number, height: number): AABB
export function testAABBIntersection(a: AABB, b: AABB): boolean
```

### 5.2 噪声工具

**文件**: `src/utils/noise.ts`

```typescript
import { ImprovedNoise } from 'three'

export function createSeededNoise(seed: number): ImprovedNoise

export function lerp(start: number, end: number, t: number): number
export function smoothStep(edge0: number, edge1: number, x: number): number

// 生物群系混合
export function getBiomeBlend(biomeNoise: number, configs: BiomeConfig[]): BiomeConfig
```

---

## 6. 常量定义

### 6.1 游戏配置

**文件**: `src/constants/config.ts`

```typescript
export const GAME_CONFIG = {
  // 世界
  WORLD_SIZE: 256,
  CHUNK_SIZE: 16,
  CHUNK_HEIGHT: 16,
  CHUNK_SECTION_COUNT: 16,  // 256 / 16
  SEA_LEVEL: 64,

  // 渲染
  DEFAULT_RENDER_DISTANCE: 6,
  MIN_RENDER_DISTANCE: 4,
  MAX_RENDER_DISTANCE: 12,
  FOV: 75,
  FAR_PLANE: 500,
  NEAR_PLANE: 0.1,

  // 玩家
  PLAYER_HEIGHT: 1.8,
  PLAYER_WIDTH: 0.6,
  EYE_HEIGHT: 1.62,
  WALK_SPEED: 4.3,
  SPRINT_SPEED: 5.6,
  JUMP_FORCE: 8,
  GRAVITY: 20,

  // 交互
  REACH_DISTANCE: 10,
  DIGGING_SPEED: 1.0,
  CLICK_THROTTLE: 100,
  AUTO_SAVE_INTERVAL: 30000,

  // 性能
  MAX_CHUNK_LOADS_PER_FRAME: 2,
  MAX_CHUNK_UNLOADS_PER_FRAME: 4,
  MAX_MESH_UPDATES_PER_FRAME: 10,
} as const

export const CONTROL_KEYS = {
  FORWARD: 'KeyW',
  BACKWARD: 'KeyS',
  LEFT: 'KeyA',
  RIGHT: 'KeyD',
  JUMP: 'Space',
  SPRINT: 'ShiftLeft',
  SLOT_1: 'Digit1',
  SLOT_2: 'Digit2',
  SLOT_3: 'Digit3',
  SLOT_4: 'Digit4',
  SLOT_5: 'Digit5',
  SLOT_6: 'Digit6',
  SLOT_7: 'Digit7',
  SLOT_8: 'Digit8',
  SLOT_9: 'Digit9',
  CYCLE_SLOT: 'KeyQ',
  TOGGLE_WHEEL: 'Tab',
  TOGGLE_DEBUG: 'F3',
  PAUSE: 'Escape',
} as const
```

### 6.2 方块定义

**文件**: `src/constants/blocks.ts`

```typescript
import { BlockDef } from '@/types/block'

export const BLOCKS: Record<number, BlockDef> = {
  0: {
    id: 0,
    name: 'air',
    texture: '',
    transparent: true,
    solid: false,
    gravityAffected: false,
    hardness: 0,
    digTime: 0,
  },
  1: {
    id: 1,
    name: 'grass',
    texture: ['grass_top', 'dirt', 'grass_side', 'grass_side', 'grass_side', 'grass_side'],
    transparent: false,
    solid: true,
    gravityAffected: false,
    hardness: 1.0,
    digTime: 1.0,
  },
  // ... 其他方块
}

export const DEFAULT_HOTBAR = [1, 2, 3, 4, 5, 6, 7, 8, 10]  // 初始快捷栏
```

---

## 7. 实现里程碑

### Phase 1 - 核心框架（预计 10-14 天）

#### 任务 1.1: 项目初始化（1 天）
- [ ] 创建 Vite + Vue3 + TypeScript 项目
- [ ] 配置 ESLint + Prettier
- [ ] 安装依赖：three, pinia, element-plus, idb-keyval
- [ ] 配置路径别名 `@/*`
- [ ] 创建基础目录结构

#### 任务 1.2: Three.js 场景搭建（1 天）
- [ ] 实现 SceneManager 基础类
- [ ] 创建渲染循环
- [ ] 实现窗口 resize 处理
- [ ] 添加基础光照（环境光 + 平行光）

#### 任务 1.3: 玩家控制基础（2 天）
- [ ] 实现 PointerLockControls 集成
- [ ] WASD 移动输入处理
- [ ] 跳跃功能
- [ ] 相机视角旋转

#### 任务 1.4: 简单平面世界（2 天）
- [ ] 实现 Chunk 基础类
- [ ] 实现 ChunkManager
- [ ] 创建平面地形生成（全平原）
- [ ] 基础方块纹理加载

#### 任务 1.5: 方块交互（3 天）
- [ ] 实现 BlockSystem
- [ ] 左键挖掘功能（含进度）
- [ ] 右键放置功能
- [ ] 方块选中高亮
- [ ] 点击限流

#### 任务 1.6: 基础 UI（2 天）
- [ ] 快捷栏组件
- [ ] 准星组件
- [ ] 数字键切换槽位
- [ ] Q 键循环切换

#### 任务 1.7: 碰撞检测（2 天）
- [ ] 实现 CollisionDetector
- [ ] 玩家 AABB 碰撞体
- [ ] 边界检测
- [ ] 玩家卡住处理

---

### Phase 2 - 世界生成（预计 5-7 天）

#### 任务 2.1: 噪声集成（1 天）
- [ ] 集成 Three.js ImprovedNoise
- [ ] 实现高度图生成
- [ ] 实现生物群系噪声

#### 任务 2.2: 地形生成（2 天）
- [ ] 平原地形生成
- [ ] 山脉地形生成
- [ ] 海洋地形生成
- [ ] 地形混合过渡

#### 任务 2.3: 区块优化（2 天）
- [ ] 实现贪婪网格算法
- [ ] 背面剔除优化
- [ ] 区块动态加载/卸载

#### 任务 2.4: 碰撞完善（1 天）
- [ ] 复杂地形碰撞
- [ ] 斜坡处理
- [ ] 性能优化

---

### Phase 3 - 游戏系统（预计 5-7 天）

#### 任务 3.1: 完整方块系统（2 天）
- [ ] 10 种基础方块定义
- [ ] 方块纹理贴图
- [ ] 透明方块处理（玻璃、树叶）
- [ ] 重力方块（沙子）

#### 任务 3.2: 工具系统框架（1 天）
- [ ] 工具类型定义
- [ ] 挖掘速度倍率
- [ ] 预留耐久度接口

#### 任务 3.3: 音效系统（1 天）
- [ ] 音效加载
- [ ] 3D 空间音频
- [ ] 脚步声、挖掘声、放置声

#### 任务 3.4: UI 完善（2 天）
- [ ] 方块选择轮盘
- [ ] 暂停菜单
- [ ] 调试信息 overlay
- [ ] 设置面板框架

---

### Phase 4 - 存档与优化（预计 5-7 天）

#### 任务 4.1: 存档系统（2 天）
- [ ] IndexedDB 集成
- [ ] 存档序列化/反序列化
- [ ] 自动保存
- [ ] 手动保存/读取

#### 任务 4.2: 性能优化（2 天）
- [ ] 帧率监控
- [ ] 内存优化
- [ ] 渲染批次优化
- [ ] 分帧处理

#### 任务 4.3: 设置与配置（1 天）
- [ ] 渲染距离设置
- [ ] 灵敏度设置
- [ ] 按键绑定框架

#### 任务 4.4: 测试与修复（2 天）
- [ ] 边界场景测试
- [ ] 性能压力测试
- [ ] Bug 修复
- [ ] 验收测试

---

## 8. 技术风险与缓解

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|---------|
| 性能不达标 (60 FPS) | 高 | 中 | 早期性能测试，逐步增加渲染距离验证 |
| 内存泄漏 | 高 | 中 | 严格的 dispose 检查，使用 Chrome DevTools 监控 |
| 存档损坏 | 高 | 低 | 备份机制，版本校验，原子写入 |
| 加载时间过长 | 中 | 中 | 分块加载，进度显示，Web Worker |
| 纹理内存过大 | 中 | 中 | 纹理图集，压缩纹理，按需加载 |

---

## 9. 开发环境配置

### 9.1 前置要求
- Node.js 18+
- pnpm 8+
- 现代浏览器（Chrome 100+ 推荐）

### 9.2 开发命令
```bash
# 安装依赖
pnpm install

# 开发模式
pnpm dev

# 构建
pnpm build

# 类型检查
pnpm type-check

# 代码检查
pnpm lint
pnpm format
```

### 9.3 推荐 VSCode 插件
- Volar (Vue 3)
- ESLint
- Prettier
- TypeScript Hero

---

## 10. 代码审查清单

### 提交前检查
- [ ] TypeScript 无错误
- [ ] ESLint 无警告
- [ ] 无 `console.log`（调试专用除外）
- [ ] 无 `any` 类型（必要时用 `unknown`）
- [ ] 所有 Three.js 对象有 dispose 调用
- [ ] 事件监听器有清理
- [ ] 新增代码有注释（复杂逻辑）
- [ ] 符合命名规范

### 性能检查
- [ ] 大循环内无内存分配
- [ ] 向量复用（使用 `vector.copy()`）
- [ ] 避免每帧创建新对象
- [ ] 使用对象池管理频繁创建/销毁的对象

---

*文档版本：1.0*
*创建日期：2026-03-12*
*最后更新：2026-03-12*
