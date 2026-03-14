<template>
  <div v-if="!store.isPlaying" class="pause-menu">
    <div class="pause-content">
      <h1>Minecraft Vue3</h1>
      <p class="subtitle">点击画面开始游戏</p>

      <div class="controls-section">
        <h2>操作说明</h2>
        <div class="control-grid">
          <div class="control-item">
            <span class="key">W A S D</span>
            <span class="desc">移动</span>
          </div>
          <div class="control-item">
            <span class="key">SPACE</span>
            <span class="desc">跳跃</span>
          </div>
          <div class="control-item">
            <span class="key">SHIFT</span>
            <span class="desc">加速</span>
          </div>
          <div class="control-item">
            <span class="key">1-9</span>
            <span class="desc">选择方块</span>
          </div>
          <div class="control-item">
            <span class="key">Q</span>
            <span class="desc">切换方块</span>
          </div>
          <div class="control-item">
            <span class="key">TAB</span>
            <span class="desc">调试信息</span>
          </div>
          <div class="control-item">
            <span class="key">F</span>
            <span class="desc">保存游戏</span>
          </div>
          <div class="control-item">
            <span class="key">ESC</span>
            <span class="desc">暂停</span>
          </div>
        </div>

        <div class="interaction-section">
          <h2>方块交互</h2>
          <div class="control-item">
            <span class="key">左键长按</span>
            <span class="desc">挖掘方块</span>
          </div>
          <div class="control-item">
            <span class="key">右键</span>
            <span class="desc">放置方块</span>
          </div>
        </div>
      </div>

      <div class="tips">
        <p>按 ESC 返回游戏</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useGameStore } from '@/stores/game'

const store = useGameStore()
</script>

<style scoped>
.pause-menu {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.65);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}

.pause-content {
  text-align: center;
  color: white;
  max-width: 600px;
  padding: 20px;
}

.pause-content h1 {
  font-size: 48px;
  margin-bottom: 10px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
}

.subtitle {
  font-size: 20px;
  margin-bottom: 30px;
  opacity: 0.9;
}

.controls-section {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
}

.controls-section h2 {
  font-size: 24px;
  margin-bottom: 15px;
}

.control-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
}

.control-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.key {
  background: rgba(255, 255, 255, 0.2);
  padding: 8px 16px;
  border-radius: 4px;
  font-weight: bold;
  font-size: 14px;
  min-width: 80px;
  text-align: center;
}

.desc {
  font-size: 12px;
  opacity: 0.8;
}

.interaction-section {
  margin-top: 15px;
}

.interaction-section h2 {
  font-size: 20px;
  margin-bottom: 10px;
}

.tips {
  margin-top: 20px;
  font-size: 14px;
  opacity: 0.7;
}
</style>
