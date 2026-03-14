import type { BlockDef } from '@/types/block'

export const BLOCKS: Record<number, BlockDef> = {
  0: {
    id: 0,
    name: 'air',
    texture: '',
    transparent: true,
    solid: false,
    gravityAffected: false,
    hardness: 0,
    digTime: 0,
  },
  1: {
    id: 1,
    name: 'grass',
    texture: ['grass_top', 'grass_side', 'dirt'],
    transparent: false,
    solid: true,
    gravityAffected: false,
    hardness: 1.0,
    digTime: 1.0,
  },
  2: {
    id: 2,
    name: 'dirt',
    texture: 'dirt',
    transparent: false,
    solid: true,
    gravityAffected: false,
    hardness: 1.0,
    digTime: 1.0,
  },
  3: {
    id: 3,
    name: 'stone',
    texture: 'stone',
    transparent: false,
    solid: true,
    gravityAffected: false,
    hardness: 1.5,
    digTime: 1.5,
  },
  4: {
    id: 4,
    name: 'wood',
    texture: 'wood_side',
    transparent: false,
    solid: true,
    gravityAffected: false,
    hardness: 1.0,
    digTime: 1.0,
  },
  5: {
    id: 5,
    name: 'leaves',
    texture: 'leaves',
    transparent: true,
    solid: true,
    gravityAffected: false,
    hardness: 0.5,
    digTime: 0.5,
  },
  6: {
    id: 6,
    name: 'sand',
    texture: 'sand',
    transparent: false,
    solid: true,
    gravityAffected: true,
    hardness: 0.5,
    digTime: 0.5,
  },
  7: {
    id: 7,
    name: 'glass',
    texture: 'glass',
    transparent: true,
    solid: true,
    gravityAffected: false,
    hardness: 0.3,
    digTime: 0.3,
  },
  8: {
    id: 8,
    name: 'brick',
    texture: 'brick',
    transparent: false,
    solid: true,
    gravityAffected: false,
    hardness: 1.0,
    digTime: 1.0,
  },
  9: {
    id: 9,
    name: 'coal_ore',
    texture: 'coal_ore',
    transparent: false,
    solid: true,
    gravityAffected: false,
    hardness: 2.0,
    digTime: 2.0,
  },
  10: {
    id: 10,
    name: 'bedrock',
    texture: 'bedrock',
    transparent: false,
    solid: true,
    gravityAffected: false,
    hardness: Infinity,
    digTime: Infinity,
  },
}

export const DEFAULT_HOTBAR = [1, 2, 3, 4, 5, 6, 7, 8, 10]

export function getBlockDef(id: number): BlockDef {
  return BLOCKS[id] || BLOCKS[0]
}

export function isBlockSolid(id: number): boolean {
  return BLOCKS[id]?.solid ?? false
}

export function isBlockTransparent(id: number): boolean {
  return BLOCKS[id]?.transparent ?? false
}

export function isBlockGravityAffected(id: number): boolean {
  return BLOCKS[id]?.gravityAffected ?? false
}
