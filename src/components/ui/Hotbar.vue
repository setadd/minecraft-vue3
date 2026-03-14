<template>
  <div class="hotbar">
    <div
      v-for="i in 9"
      :key="i"
      class="slot"
      :class="{ active: i - 1 === selectedSlot }"
    >
      <span class="slot-number">{{ i }}</span>
      <span class="slot-block">{{ getBlockName(inventory[i - 1]?.blockId) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '@/stores/game'
import { getBlockDef } from '@/constants/blocks'

const store = useGameStore()
const selectedSlot = computed(() => store.selectedSlot)
const inventory = computed(() => store.inventory)

const getBlockName = (blockId: number) => {
  const block = getBlockDef(blockId)
  return block.name === 'air' ? '' : block.name.substring(0, 8)
}
</script>

<style scoped>
.hotbar {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 4px;
  background: rgba(0, 0, 0, 0.5);
  padding: 8px;
  border-radius: 8px;
  z-index: 100;
}

.slot {
  width: 50px;
  height: 50px;
  background: rgba(139, 139, 139, 0.6);
  border: 3px solid #555;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 10px;
  position: relative;
}

.slot.active {
  border-color: #fff;
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
}

.slot-number {
  position: absolute;
  top: 2px;
  left: 4px;
  font-size: 8px;
  opacity: 0.7;
}
</style>
