<template>
  <div v-if="isVisible" class="block-wheel-overlay" @click="hideWheel">
    <div class="block-wheel" :style="wheelStyle">
      <div
        v-for="(slot, index) in visibleSlots"
        :key="index"
        class="wheel-slot"
        :class="{ selected: slot.index === store.selectedSlot }"
        :style="getSlotStyle(index)"
        @click.stop="selectSlot(slot.index)"
      >
        <div class="slot-inner">
          <div class="slot-number">{{ slot.index + 1 }}</div>
          <div class="slot-block" :style="{ backgroundColor: getBlockColor(slot.blockId) }"></div>
          <div class="slot-name">{{ getBlockName(slot.blockId) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useGameStore } from '@/stores/game'
import { BLOCKS } from '@/constants/blocks'

const store = useGameStore()

const isVisible = ref(false)
const wheelStyle = ref({ transform: 'rotate(0deg)' })

// 获取可见的快捷栏槽位
const visibleSlots = computed(() => {
  return store.inventory.map((item, index) => ({
    index,
    blockId: item.blockId,
  }))
})

// 显示轮盘
function showWheel() {
  isVisible.value = true
}

// 隐藏轮盘
function hideWheel() {
  isVisible.value = false
}

// 切换轮盘
function toggleWheel() {
  isVisible.value = !isVisible.value
}

// 选择槽位
function selectSlot(index: number) {
  store.selectSlot(index)
  isVisible.value = false
}

// 暴露给外部调用
defineExpose({
  showWheel,
  hideWheel,
  toggleWheel,
})

// 获取方块颜色
function getBlockColor(blockId: number): string {
  const colors: Record<number, string> = {
    0: '#000000',
    1: '#567d46',
    2: '#8b5a2b',
    3: '#808080',
    4: '#654321',
    5: '#228b22',
    6: '#f4e4a9',
    7: '#a8d5e2',
    8: '#8b0000',
    9: '#2d2d2d',
    10: '#1a1a1a',
  }
  return colors[blockId] || '#ff0000'
}

// 获取方块名称
function getBlockName(blockId: number): string {
  const block = BLOCKS[blockId]
  return block?.name || 'Unknown'
}

// 计算槽位样式（圆形排列）
function getSlotStyle(index: number) {
  const totalSlots = visibleSlots.value.length
  const angle = (index / totalSlots) * 360 - 90 // 从顶部开始
  const radius = 120 // 半径
  const radian = (angle * Math.PI) / 180

  const x = Math.cos(radian) * radius
  const y = Math.sin(radian) * radius

  return {
    transform: `translate(${x}px, ${y}px)`,
  }
}
</script>

<style scoped>
.block-wheel-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 300;
  cursor: pointer;
}

.block-wheel {
  position: relative;
  width: 300px;
  height: 300px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.8);
  border: 3px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
}

.wheel-slot {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 60px;
  height: 60px;
  margin-left: -30px;
  margin-top: -30px;
  cursor: pointer;
  transition: transform 0.1s;
}

.wheel-slot:hover {
  transform: scale(1.1);
}

.wheel-slot.selected {
  transform: scale(1.15);
}

.slot-inner {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
}

.wheel-slot.selected .slot-inner {
  border-color: #4CAF50;
  background: rgba(76, 175, 80, 0.3);
}

.slot-number {
  position: absolute;
  top: 2px;
  left: 4px;
  font-size: 10px;
  color: rgba(255, 255, 255, 0.6);
}

.slot-block {
  width: 24px;
  height: 24px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 2px;
}

.slot-name {
  position: absolute;
  bottom: -20px;
  font-size: 10px;
  color: white;
  white-space: nowrap;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
}
</style>
