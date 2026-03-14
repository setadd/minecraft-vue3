# 代码开发规范 - Minecraft 复刻项目

## 技术栈
| 项目 | 技术 |
|------|------|
| 框架 | Vue 3.4+ (Composition API) |
| UI 组件 | Element Plus |
| 3D 引擎 | Three.js r150+ |
| 语言 | TypeScript 5.x |
| 构建工具 | Vite 5.x |
| 包管理器 | pnpm |
| 状态管理 | Pinia |

## 目录结构
```
src/
├── assets/          # 静态资源（textures、sounds、models）
├── components/      # Vue 组件（ui、game、common）
├── composables/     # 组合式函数
├── constants/       # 常量定义（config、blocks）
├── core/            # 核心引擎（ChunkManager、PlayerController 等）
├── shaders/         # Shader 文件
├── stores/          # Pinia 状态管理
├── types/           # TypeScript 类型定义
├── utils/           # 工具函数
└── views/           # 页面视图
```

## 命名规范
| 类型 | 规范 | 示例 |
|------|------|------|
| Vue 组件 | `PascalCase.vue` | `BlockSelector.vue` |
| TypeScript 类 | `PascalCase.ts` | `WorldGenerator.ts` |
| 工具函数 | `camelCase.ts` | `blockUtils.ts` |
| 常量文件 | `UPPER_SNAKE_CASE.ts` | `BLOCK_TYPES.ts` |

```typescript
// ✅ 变量命名
const chunkSize = 16
const playerPosition = ref<Vector3>(new Vector3())

// ✅ 接口定义
interface RaycastResult {
  hit: boolean
  position: THREE.Vector3 | null
}
```

## Vue 组件规范

### 标准模板
```vue
<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useGameStore } from '@/stores/game'

// 1. Props 定义
interface Props { blockSize?: number }
const props = withDefaults(defineProps<Props>(), { blockSize: 1 })

// 2. Emits 定义
interface Emits { (e: 'block-change', blockId: number): void }
const emit = defineEmits<Emits>()

// 3. 响应式数据
const isVisible = ref(false)

// 4. 计算属性
const displaySize = computed(() => props.blockSize * 16)

// 5. 方法
const handleClick = () => { emit('block-change', 1) }

// 6. 生命周期
onMounted(() => { init() })
onUnmounted(() => { cleanup() })
</script>

<template>
  <div class="component">内容</div>
</template>

<style scoped>
.component { }
</style>
```

### 原则
- 每个组件只做一件事
- UI 组件与逻辑组件分离
- 使用 `defineProps` 和 `defineEmits` 定义接口

## Three.js 规范

### 内存管理（必须遵守）
```typescript
class Chunk {
  private mesh: THREE.Mesh | null = null
  private geometry: THREE.BufferGeometry | null = null
  private material: THREE.Material | null = null

  public dispose(): void {
    if (this.mesh) {
      this.geometry?.dispose()
      this.material?.dispose()
      this.mesh = null
    }
  }
}
```

### 性能优化
- 使用 `InstancedMesh` 渲染相同方块
- 使用 `FrustumCulling` 视锥体剔除
- 批量更新几何体

## 核心系统设计

### 区块系统
```typescript
// 常量
export const CHUNK_SIZE = 16
export const CHUNK_HEIGHT = 256

// 区块索引计算
class Chunk {
  private blocks: Uint8Array

  getBlock(x: number, y: number, z: number): number {
    const index = (y * CHUNK_SIZE + z) * CHUNK_SIZE + x
    return this.blocks[index]
  }

  setBlock(x: number, y: number, z: number, blockId: number): void {
    const index = (y * CHUNK_SIZE + z) * CHUNK_SIZE + x
    this.blocks[index] = blockId
    this.isDirty = true  // 标记需要重建网格
  }
}
```

### 方块定义
```typescript
// types/block.ts
interface BlockDef {
  id: number
  name: string
  texture: string | string[]  // 单纹理或六面纹理
  transparent: boolean
  solid: boolean
  gravityAffected: boolean
  hardness: number  // Infinity = 不可破坏（如基岩）
}

// constants/blocks.ts
export const BLOCKS: Record<number, BlockDef> = {
  0: { id: 0, name: 'air', texture: '', transparent: true, solid: false, gravityAffected: false, hardness: 0 },
  1: { id: 1, name: 'grass', texture: ['grass_top', 'grass_side', 'dirt'], transparent: false, solid: true, gravityAffected: false, hardness: 1 },
}
```

### 玩家控制器
```typescript
class PlayerController {
  // 核心属性
  position: THREE.Vector3
  velocity: THREE.Vector3
  onGround: boolean
  isFlying: boolean

  // 核心方法
  update(delta: number): void                    // 每帧更新
  handleInput(code: string, pressed: boolean): void
  toggleFlying(): void                           // 切换飞行
  dispose(): void                                // 清理资源
}
```

### 碰撞检测
```typescript
class CollisionDetector {
  checkCollision(position: THREE.Vector3): {
    isColliding: boolean
    normal: THREE.Vector3 | null  // 碰撞法线方向
  }

  isOnGround(position: THREE.Vector3): boolean

  getGroundHeight(x: number, z: number, currentY: number): number
}
```

## 状态管理 (Pinia)

```typescript
// stores/game.ts
import { defineStore } from 'pinia'

export const useGameStore = defineStore('game', {
  state: (): GameState => ({
    isPlaying: false,
    selectedBlock: 1,
    inventory: []
  }),

  getters: {
    canPlace: (state) => state.isPlaying && !state.isPaused
  },

  actions: {
    setPlaying(playing: boolean) { this.isPlaying = playing },
    selectBlock(blockId: number) { this.selectedBlock = blockId }
  }
})
```

## TypeScript 规范

```typescript
// ✅ 使用接口定义类型
interface DiggingState {
  targetBlock: { x: number; y: number; z: number }
  progress: number
}

// ✅ 使用类型注解
function raycast(origin: Vector3, maxDist: number): RaycastResult { }

// ❌ 避免使用 any
function process(data: any) {} // 错误

// ✅ 必要时使用 unknown
function process(data: unknown) {
  if (typeof data === 'string') {
    // 类型收窄
  }
}
```

## 注释规范

```typescript
/**
 * 计算两个位置之间的视线
 * @param start 起始位置
 * @param end 结束位置
 * @param stepSize 步进大小
 * @returns 路径上的所有点
 */
function calculateLineOfSight(start: Vector3, end: Vector3, stepSize: number): Vector3[] {
  // 实现
}

// TODO: 添加雾效果
// FIXME: 修复快速移动时的穿墙问题
// NOTE: 这里使用 16 因为是区块大小的 1/16
```

## 性能准则

| 技术 | 用途 |
|------|------|
| 对象池 | 复用频繁创建/销毁的对象 |
| LOD | 远距离使用简化的模型 |
| 视锥体剔除 | 只渲染可见区块 |
| 延迟加载 | 按需加载资源 |
| Web Worker | 耗时的计算放到 Worker |

## Git 提交规范

```bash
<type>(<scope>): <subject>

# type 类型
feat: 新功能     |  fix: 修复 bug  |  refactor: 重构
docs: 文档       |  style: 格式    |  test: 测试
chore: 构建/工具

# 示例
feat(player): 添加飞行功能
fix(raycast): 修复射线检测精度问题
refactor(core): 重构玩家移动逻辑
```

## 审查清单

### 提交前检查
- [ ] 没有 TypeScript 错误
- [ ] 没有 console.log（调试用除外）
- [ ] 已清理未使用的导入
- [ ] 已添加必要的类型注解
- [ ] 已测试核心功能
- [ ] 内存已正确清理（Three.js 资源 dispose）

## 新增功能开发流程

1. **确定功能类型** → 选择对应目录（core/components/stores）
2. **定义类型接口** → `types/` 下定义数据结构
3. **实现核心逻辑** → `core/` 下实现类和方法
4. **创建 UI 组件** → `components/` 下创建 Vue 组件
5. **状态管理** → 需要全局状态时更新 `stores/`
6. **内存清理** → 在 `onUnmounted` 中清理 Three.js 资源
7. **测试验证** → 功能测试 + 类型检查
8. **提交代码** → 按规范写 commit message

## 快捷键绑定规范

```typescript
// GameView.vue 中绑定按键
const handleKeydown = (e: KeyboardEvent) => {
  if (e.code === 'KeyG') {
    e.preventDefault()
    playerController?.toggleFlying()  // G 键切换飞行
  }
  if (e.code === 'Digit1' && e.code <= 'Digit9') {
    const slot = parseInt(e.code.replace('Digit', '')) - 1
    store.selectSlot(slot)  // 数字键切换快捷栏
  }
}
```

## 常用配置常量

```typescript
// constants/config.ts
export const GAME_CONFIG = {
  CHUNK_SIZE: 16,
  CHUNK_HEIGHT: 256,
  DEFAULT_RENDER_DISTANCE: 4,
  REACH_DISTANCE: 5,
  PLAYER_HEIGHT: 1.8,
  PLAYER_WIDTH: 0.6,
  WALK_SPEED: 5,
  FLY_SPEED: 15,
  GRAVITY: 9.8,
  JUMP_FORCE: 8,
  CLICK_THROTTLE: 100,  // 点击间隔（毫秒）
  SPAWN_X: 0,
  SPAWN_Z: 0,
  SPAWN_Y_OFFSET: 50,   // 出生点高度偏移
}
```
