<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { SceneManager } from '@/core/SceneManager'

const containerRef = ref<HTMLElement | null>(null)
let sceneManager: SceneManager | null = null

onMounted(() => {
  if (containerRef.value) {
    sceneManager = new SceneManager(containerRef.value)
    sceneManager.init()
  }
})

onUnmounted(() => {
  sceneManager?.dispose()
})

// 暴露给父组件
defineExpose({
  getSceneManager: () => sceneManager,
})
</script>

<template>
  <div ref="containerRef" class="game-canvas"></div>
</template>

<style scoped>
.game-canvas {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}

.game-canvas canvas {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
