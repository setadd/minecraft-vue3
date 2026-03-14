# Minecraft Vue3

一个使用 Vue 3 + Three.js 开发的 Minecraft 风格沙盒游戏。

![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![Vue](https://img.shields.io/badge/Vue-3.4+-green)
![Three.js](https://img.shields.io/badge/Three.js-r150+-lightgrey)
![Vite](https://img.shields.io/badge/Vite-5.x-purple)

## 功能特性

- 程序化生成的世界（基于 Perlin 噪声）
- 区块加载和渲染系统
- 第一人称视角控制
- 方块放置和破坏
- 物理系统（重力、碰撞检测）
- 飞行模式（创意模式）
- 快捷栏和方块选择轮盘
- 世界保存和加载（IndexedDB）

## 技术栈

| 技术 | 版本 |
|------|------|
| Vue | 3.4+ |
| TypeScript | 5.x |
| Three.js | r150+ |
| Vite | 5.x |
| Pinia | 2.1+ |
| Element Plus | 2.6+ |

## 快速开始

### 环境要求

- Node.js 18+
- pnpm 8+

### 安装依赖

```bash
pnpm install
```

### 启动开发服务器

```bash
pnpm dev
```

访问 http://localhost:5173

### 构建生产版本

```bash
pnpm build
```

### 类型检查

```bash
pnpm type-check
```

## 游戏操作

| 按键 | 功能 |
|------|------|
| W/A/S/D | 移动 |
| 空格 | 跳跃 / 飞行时上升 |
| Shift | 奔跑 / 飞行时下降 |
| G | 切换飞行模式 |
| 鼠标左键 | 破坏方块 |
| 鼠标右键 | 放置方块 |
| 1-9 | 选择快捷栏方块 |
| Q | 循环快捷栏 |
| Tab | 打开方块选择轮盘 |
| F3 | 显示/隐藏调试信息 |
| F | 手动保存游戏 |
| Esc | 暂停游戏 |

## 项目结构

```
src/
├── assets/          # 静态资源
├── components/      # Vue 组件
│   ├── game/        # 游戏核心组件
│   └── ui/          # UI 组件
├── constants/       # 游戏配置常量
├── core/            # 核心游戏系统
│   ├── AudioSystem.ts      # 音频系统
│   ├── BlockMaterials.ts   # 方块材质
│   ├── BlockSystem.ts      # 方块交互
│   ├── Chunk.ts            # 区块类
│   ├── ChunkManager.ts     # 区块管理
│   ├── CollisionDetector.ts # 碰撞检测
│   ├── PlayerController.ts # 玩家控制
│   ├── SaveSystem.ts       # 保存系统
│   ├── TextureManager.ts   # 纹理管理
│   └── WorldGenerator.ts   # 世界生成
├── stores/          # Pinia 状态管理
├── types/           # TypeScript 类型定义
├── utils/           # 工具函数
└── views/           # 页面视图
```

## 核心系统

### 世界生成

使用 Perlin 噪声算法生成程序化地形：
- 支持自定义种子
- 区块大小：16x256x16
- 可配置渲染距离

### 区块系统

- 按需加载和卸载区块
- 动态网格重建
- 视锥体剔除优化

### 物理系统

- AABB 碰撞检测
- 重力和速度模拟
- 玩家与方块的碰撞处理

## 开发规范

详见 [CLAUDE.md](./CLAUDE.md)

### Git 提交规范

```bash
<type>(<scope>): <subject>

# 类型
feat: 新功能
fix: 修复 bug
docs: 文档更新
style: 代码格式
refactor: 重构
test: 测试
chore: 构建/工具
```

## 截图



## 开发计划

- [ ] 更多方块类型
- [ ] 生物系统
- [ ] 合成系统
- [ ] 多人联机
- [ ] 模组支持

## 许可证

MIT

## 致谢

- Inspired by Minecraft
- Built with Vue 3 and Three.js
