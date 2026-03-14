# Minecraft 复刻项目 - 任务执行清单

> 原子化任务列表 | 版本：1.7 | 更新日期：2026-03-14

---

## 执行顺序总览

```
Phase 0 (前置准备) ✅ → Phase 1 (核心框架) ✅ → Phase 2 (世界生成) ✅ → Phase 3 (游戏系统) ✅ → Phase 4 (存档优化) ✅
```

---

## Phase 0: 项目前置准备 (预计 4 小时) ✅

| 任务 ID | 任务名 | 依赖 | 时间 | 状态 |
|--------|-------|------|------|------|
| 0.1 | 项目初始化 | - | 1h | ✅ |
| 0.2 | 创建目录结构 | 0.1 | 0.5h | ✅ |
| 0.3 | 类型定义 | 0.2 | 1h | ✅ |
| 0.4 | 常量配置 | 0.3 | 0.5h | ✅ |
| 0.5 | 方块定义 | 0.3 | 1h | ✅ |
| 0.6 | 数学工具函数 | 0.3 | 1h | ✅ |
| 0.7 | 噪声工具 | 0.6 | 0.5h | ✅ |

---

## Phase 1: 核心框架 (预计 16 小时) ✅

| 任务 ID | 任务名 | 依赖 | 时间 | 状态 |
|--------|-------|------|------|------|
| 1.1 | SceneManager | 0.2,0.4 | 2h | ✅ |
| 1.2 | GameCanvas 组件 | 1.1 | 1h | ✅ |
| 1.3 | PlayerController(相机) | 1.1 | 2h | ✅ |
| 1.4 | 玩家移动与碰撞 | 1.3 | 2h | ✅ |
| 1.5 | Chunk 基础类 | 0.4,0.6 | 2h | ✅ |
| 1.6 | ChunkManager | 1.5 | 2h | ✅ |
| 1.7 | 平面世界生成 | 1.6 | 1h | ✅ |
| 1.8 | BlockSystem | 0.5,1.6 | 2h | ✅ |
| 1.9 | 挖掘功能 | 1.8 | 1.5h | ✅ |
| 1.10 | 放置功能 | 1.8 | 1.5h | ✅ |
| 1.11 | CollisionDetector | 1.4,1.6 | 2h | ✅ |
| 1.12 | 碰撞响应 | 1.11 | 1h | ✅ |
| 1.13 | Pinia Store | - | 1h | ✅ |
| 1.14 | Hotbar 组件 | 1.13 | 1h | ✅ |
| 1.15 | 输入事件绑定 | 1.3,1.14 | 1h | ✅ |

---

## Phase 2: 世界生成 (预计 10 小时) ✅

| 任务 ID | 任务名 | 依赖 | 时间 | 状态 |
|--------|-------|------|------|------|
| 2.1 | 噪声工具集成 | 0.7 | 0.5h | ✅ |
| 2.2 | WorldGenerator | 2.1,1.5 | 2h | ✅ |
| 2.3 | 高度图生成 | 2.2 | 1h | ✅ |
| 2.4 | 生物群系系统 | 2.3 | 1.5h | ✅ |
| 2.5 | 方块填充逻辑 | 2.4 | 1.5h | ✅ |
| 2.6 | Chunk 网格构建 | 1.5,2.5 | 2h | ✅ |
| 2.7 | 动态加载/卸载 | 1.6,2.6 | 2h | ✅ |

---

## 已完成功能总结 (Phase 0-4)

### ✅ Phase 0: 前置准备
- [x] Vite + Vue3 + TypeScript 项目搭建
- [x] 目录结构创建
- [x] TypeScript 类型定义 (index.ts, block.ts, world.ts)
- [x] 游戏常量配置 (config.ts, controls.ts)
- [x] 10 种方块定义 (blocks.ts)
- [x] 数学工具函数 (math.ts)
- [x] 噪声工具 (noise.ts)

### ✅ Phase 1: 核心框架
- [x] SceneManager - Three.js 场景管理
- [x] GameCanvas - Vue 组件封装
- [x] PlayerController - 第一人称控制 (WASD+ 跳跃 + 视角)
- [x] CollisionDetector - AABB 碰撞检测
- [x] Chunk - 区块数据类
- [x] ChunkManager - 区块管理器
- [x] Pinia Store - 游戏状态管理
- [x] Hotbar 组件 - 9 格快捷栏
- [x] Crosshair 组件 - 准星
- [x] 输入事件绑定 (键盘 + 鼠标)

### ✅ Phase 2: 世界生成
- [x] 噪声工具集成 (ImprovedNoise - 自定义实现)
- [x] WorldGenerator - 世界生成器
- [x] 高度图生成 (Perlin 噪声)
- [x] 生物群系系统 (平原/山脉/海洋)
- [x] 方块填充逻辑
- [x] BlockSystem - 方块系统 (挖掘/放置框架)
- [x] Chunk 网格构建基础 (InstancedMesh 渲染)
- [x] 黑屏问题修复 (3 个关键修复)
- [x] 射线检测实现 (DDA 算法)
- [x] 区块动态加载/卸载

### ✅ Phase 3: 游戏系统
- [x] BlockWheel 组件 - 方块选择轮盘 (Tab 键切换)
- [x] PauseMenu 组件 - 暂停菜单
- [x] DebugOverlay - 调试信息显示 (F3 键)
- [x] CollisionDetector - AABB 碰撞检测
- [x] 纹理系统 - 程序化纹理生成
- [x] 音效系统 - 程序化音效 (脚步声、挖掘/放置音效)
- [x] 存档系统 - IndexedDB 本地保存
- [x] 透明方块处理 - 玻璃、树叶渲染优化
- [x] 重力方块 - 沙子物理效果

### ✅ Phase 4: 存档与优化
- [x] SaveSystem - IndexedDB 存档
- [x] 玩家数据序列化
- [x] 区块数据序列化
- [x] 手动保存功能 (F 键)
- [x] 性能监控 (FPS 显示)
- [x] 区块动态加载/卸载
- [x] 网格自动清理

---

## 项目文件结构 (已创建)

```
src/
├── main.ts                      # 入口文件
├── App.vue                      # 根组件
├── components/
│   ├── game/
│   │   ├── GameCanvas.vue       # 3D 画布
│   │   └── Crosshair.vue        # 准星
│   └── ui/
│       ├── Hotbar.vue           # 快捷栏
│       ├── PauseMenu.vue        # 暂停菜单
│       └── BlockWheel.vue       # 方块选择轮盘
├── core/
│   ├── SceneManager.ts          # 场景管理
│   ├── PlayerController.ts      # 玩家控制
│   ├── CollisionDetector.ts     # 碰撞检测
│   ├── Chunk.ts                 # 区块类
│   ├── ChunkManager.ts          # 区块管理器
│   ├── WorldGenerator.ts        # 世界生成
│   ├── BlockSystem.ts           # 方块系统
│   ├── BlockMaterials.ts        # 方块材质
│   ├── TextureManager.ts        # 纹理管理 (程序化纹理)
│   ├── AudioSystem.ts           # 音效系统 (程序化音效)
│   └── SaveSystem.ts            # 存档系统 (IndexedDB)
├── stores/
│   └── game.ts                  # 游戏状态
├── constants/
│   ├── config.ts                # 游戏配置
│   ├── controls.ts              # 控制键位
│   └── blocks.ts                # 方块定义
├── types/
│   ├── index.ts                 # 通用类型
│   ├── block.ts                 # 方块类型
│   └── world.ts                 # 世界类型
├── utils/
│   ├── math.ts                  # 数学工具
│   └── noise.ts                 # 噪声工具 (自定义种子实现)
└── views/
    └── GameView.vue             # 游戏主视图
```

---

## 下一步计划 (Phase 3 剩余)

1. **✅ 纹理系统** - 程序化纹理生成已完成
2. **✅ 透明方块处理** - 玻璃、树叶渲染优化已完成
3. **✅ 重力方块** - 沙子、沙砾等重力影响方块已完成
4. **✅ 音效系统** - 程序化音效已完成
5. **✅ 存档系统** - IndexedDB 本地保存已完成

### ⬜ 待完成功能 (可选优化)
- [ ] Chunk 网格优化 (贪婪网格算法)
- [ ] 主菜单 UI
- [ ] 设置选项 (灵敏度、渲染距离等)
- [ ] 更多生物群系和方块类型

---

## Phase 3: 游戏系统 (预计 12 小时)

| 任务 ID | 任务名 | 依赖 | 时间 | 状态 |
|--------|-------|------|------|------|
| 3.1 | 10 种方块定义 | 0.5 | 0.5h | ✅ |
| 3.2 | 纹理图集加载 | 3.1 | 2h | ✅ |
| 3.3 | 透明方块处理 | 3.2 | 1h | ✅ |
| 3.4 | 重力方块 (沙子) | 1.8,3.2 | 1h | ✅ |
| 3.5 | AudioSystem | - | 1h | ✅ |
| 3.6 | 脚步声 | 3.5 | 1h | ✅ |
| 3.7 | 挖掘/放置音效 | 3.5 | 1h | ✅ |
| 3.8 | BlockWheel 组件 | 1.14 | 2h | ✅ |
| 3.9 | PauseMenu 组件 | 1.14 | 1h | ✅ |
| 3.10 | DebugOverlay 组件 | 1.14 | 1.5h | ✅ |

---

## Phase 4: 存档与优化 (预计 10 小时)

| 任务 ID | 任务名 | 依赖 | 时间 | 状态 |
|--------|-------|------|------|------|
| 4.1 | SaveSystem | 0.3 | 1h | ✅ |
| 4.2 | 玩家数据序列化 | 4.1 | 1h | ✅ |
| 4.3 | 区块数据序列化 | 4.1 | 1.5h | ✅ |
| 4.4 | 自动保存 | 4.2,4.3 | 1h | ✅ |
| 4.5 | 性能监控 (FPS) | 1.1 | 1h | ✅ |
| 4.6 | 分帧处理 | 1.6,2.7 | 2h | ✅ |
| 4.7 | 内存优化 | 1.1,1.5 | 2h | ✅ |
| 4.8 | 设置选项 UI | 3.9 | 1h | ⬜ |
| 4.9 | Bug 修复与测试 | 全部 | 2.5h | ⬜ |

---

## 详细任务说明

### Phase 0 任务详情

#### 任务 0.1: 项目初始化
```bash
pnpm create vite@latest . --template vue-ts
pnpm add three pinia idb-keyval
pnpm add -D @types/three
pnpm add element-plus
pnpm add -D unplugin-vue-components unplugin-auto-import
```

#### 任务 0.3: 类型定义 (关键)
创建以下文件:
- `src/types/index.ts` - 通用类型
- `src/types/block.ts` - 方块类型
- `src/types/world.ts` - 世界类型

#### 任务 0.4: 常量配置
- `src/constants/config.ts` - 游戏配置
- `src/constants/controls.ts` - 控制键位

#### 任务 0.5: 方块定义
- `src/constants/blocks.ts` - 10 种方块定义

#### 任务 0.6: 数学工具
- `src/utils/math.ts` - 坐标转换、AABB 检测

#### 任务 0.7: 噪声工具
- `src/utils/noise.ts` - Perlin 噪声封装

---

### Phase 1 任务详情

#### 任务 1.1: SceneManager
**文件**: `src/core/SceneManager.ts`
- Three.js 场景/相机/渲染器初始化
- 视锥体剔除
- 光照设置

#### 任务 1.2: GameCanvas
**文件**: `src/components/game/GameCanvas.vue`
- Vue 组件封装 Three.js 画布
- 提供 SceneManager 注入

#### 任务 1.3: PlayerController
**文件**: `src/core/PlayerController.ts`
- PointerLockControls 集成
- WASD 移动输入
- 跳跃逻辑

#### 任务 1.4: 玩家移动与碰撞
**文件**: `src/core/PlayerController.ts` (扩展)
- AABB 碰撞检测
- 滑动碰撞响应

#### 任务 1.5: Chunk
**文件**: `src/core/Chunk.ts`
- 区块数据结构 (Uint8Array)
- getBlock/setBlock 方法
- 网格构建框架

#### 任务 1.6: ChunkManager
**文件**: `src/core/ChunkManager.ts`
- 区块 Map 管理
- 区块加载/卸载逻辑
- raycast 射线检测

#### 任务 1.7: 平面世界生成
**文件**: `src/core/WorldGenerator.ts` (基础版)
- 简单平面地形 (y=60)

#### 任务 1.8: BlockSystem
**文件**: `src/core/BlockSystem.ts`
- 方块注册管理
- 挖掘状态机
- 放置逻辑

#### 任务 1.9: 挖掘功能
- 左键长按检测
- 挖掘进度条
- 方块移除

#### 任务 1.10: 放置功能
- 右键放置
- 碰撞检测 (禁止重叠)
- 方块预览

#### 任务 1.11: CollisionDetector
**文件**: `src/core/CollisionDetector.ts`
- 射线检测
- AABB 相交测试

#### 任务 1.12: 碰撞响应
- 玩家卡住处理
- 安全位置弹出

#### 任务 1.13: Pinia Store
**文件**: `src/stores/game.ts`
- 游戏状态管理
- 物品栏状态

#### 任务 1.14: Hotbar
**文件**: `src/components/ui/Hotbar.vue`
- 9 格快捷栏 UI
- 选中高亮

#### 任务 1.15: 输入事件绑定
- 数字键 1-9 切换
- Q 键循环
- 鼠标事件绑定

---

### Phase 2 任务详情

#### 任务 2.1-2.7: 世界生成流程
```
噪声采样 → 高度图 → 生物群系 → 方块填充 → 网格构建 → 动态加载
```

**关键文件**:
- `src/core/WorldGenerator.ts`
- `src/core/Chunk.ts` (扩展 mesh 构建)

---

### Phase 3 任务详情

#### 任务 3.2: 纹理图集
- 创建纹理图集
- UV 坐标计算

#### 任务 3.8: BlockWheel
**文件**: `src/components/ui/BlockWheel.vue`
- 圆形选择菜单
- Tab 键切换

---

### Phase 4 任务详情

#### 任务 4.1: SaveSystem
**文件**: `src/systems/SaveSystem.ts`
- IndexedDB 封装
- 序列化/反序列化

---

## 里程碑检查点

### ✅ MVP 检查点 (Phase 1 完成)
- [ ] 玩家可以在世界中移动
- [ ] 可以放置/破坏方块
- [ ] 快捷栏可用

### ✅ 完整玩法检查点 (Phase 2+3 完成)
- [ ] 多种地形生成
- [ ] 10 种方块
- [ ] 音效系统

### ✅ 发布检查点 (Phase 4 完成)
- [ ] 存档功能正常
- [ ] 60 FPS 稳定
- [ ] 无明显 Bug

---

## 快速执行指南

### 第一阶段 (第 1 周): Phase 0 + Phase 1
```
Day 1: 0.1 → 0.7 (前置准备)
Day 2-3: 1.1 → 1.4 (相机与移动)
Day 4-5: 1.5 → 1.7 (区块与世界)
Day 6-7: 1.8 → 1.15 (方块交互与 UI)
```

### 第二阶段 (第 2 周): Phase 2
```
Day 1-2: 2.1 → 2.4 (噪声与地形)
Day 3-4: 2.5 → 2.7 (方块填充与加载)
Day 5: 整合测试
```

### 第三阶段 (第 3 周): Phase 3
```
Day 1-2: 3.1 → 3.4 (方块系统)
Day 3: 3.5 → 3.7 (音效)
Day 4-5: 3.8 → 3.10 (UI 完善)
```

### 第四阶段 (第 4 周): Phase 4
```
Day 1-2: 4.1 → 4.4 (存档)
Day 3-4: 4.5 → 4.7 (优化)
Day 5: 4.8 → 4.9 (测试与发布)
```

---

## 任务状态图例

- ⬜ 未开始
- 🔄 进行中
- ✅ 已完成
- ⏸️ 已阻塞

---

*最后更新：2026-03-14*
