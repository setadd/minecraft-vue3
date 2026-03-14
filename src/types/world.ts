import type { InventorySlot } from './index'

export type BlockData = Uint8Array

export interface ChunkSectionData {
  y: number
  blocks: BlockData
  isDirty: boolean
}

export interface SaveData {
  version: number
  worldSeed: number
  worldName: string
  playerPosition: [number, number, number]
  playerRotation: [number, number]
  inventory: InventorySlot[]
  modifiedChunks: Array<{
    x: number
    z: number
    blocks: number[]
  }>
  timestamp: number
}
