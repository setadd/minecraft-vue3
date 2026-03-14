<template>
  <div id="app">
    <GameView />
  </div>
</template>

<script setup lang="ts">
import GameView from '@/views/GameView.vue'
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #app {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

#app {
  background: #000;
}
</style>
