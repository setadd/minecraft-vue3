import { defineStore } from 'pinia'
import { DEFAULT_HOTBAR } from '@/constants/blocks'
import { GAME_CONFIG } from '@/constants/config'

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
  health: number

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
    inventory: DEFAULT_HOTBAR.map(blockId => ({ blockId, count: 64 })),
    health: 100,
    renderDistance: GAME_CONFIG.DEFAULT_RENDER_DISTANCE,
    sensitivity: 1.0,
    invertY: false,
    showDebugInfo: false,
  }),

  getters: {
    selectedBlockId: (state) => state.inventory[state.selectedSlot]?.blockId ?? 0,
    canInteract: (state) => state.isPlaying && !state.isPaused,
  },

  actions: {
    setPlaying(playing: boolean) {
      this.isPlaying = playing
    },

    togglePause() {
      this.isPaused = !this.isPaused
    },

    selectSlot(slot: number) {
      if (slot >= 0 && slot < 9) {
        this.selectedSlot = slot
      }
    },

    cycleSlot(direction: number) {
      this.selectedSlot = ((this.selectedSlot + direction) % 9 + 9) % 9
    },

    setSelectedBlock(blockId: number) {
      this.inventory[this.selectedSlot] = {
        blockId,
        count: 64,
      }
    },

    // 获取玩家存档数据
    getPlayerSaveData(position: { x: number; y: number; z: number }, rotation: { x: number; y: number }) {
      return {
        position,
        rotation,
        health: this.health,
        inventory: this.inventory,
        selectedSlot: this.selectedSlot,
      }
    },

    // 加载玩家存档数据
    loadPlayerSaveData(data: { position: { x: number; y: number; z: number }; rotation: { x: number; y: number }; health: number; inventory: Array<{ blockId: number; count: number }>; selectedSlot: number }) {
      this.health = data.health
      this.inventory = data.inventory
      this.selectedSlot = data.selectedSlot
    },
  },
})
