<template>
  <div class="crosshair">
    <div class="crosshair-h"></div>
    <div class="crosshair-v"></div>
  </div>
</template>

<style scoped>
.crosshair {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 100;
}

.crosshair-h,
.crosshair-v {
  position: absolute;
  background-color: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(0, 0, 0, 0.5);
}

.crosshair-h {
  width: 20px;
  height: 2px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.crosshair-v {
  width: 2px;
  height: 20px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
</style>
