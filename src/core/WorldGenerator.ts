import { GAME_CONFIG } from '@/constants/config'
import { createSeededNoise, sampleNoise2D } from '@/utils/noise'
import type { NoiseFunction } from '@/utils/noise'

interface BiomeConfig {
  name: string
  minHeight: number
  maxHeight: number
  surfaceBlock: number
  subsurfaceBlock: number
  probability: number
}

export class WorldGenerator {
  private seed: number
  private terrainNoise: NoiseFunction
  private biomeNoise: NoiseFunction

  private static readonly BIOMES: BiomeConfig[] = [
    {
      name: 'ocean',
      minHeight: 50,
      maxHeight: 61,
      surfaceBlock: 6, // sand
      subsurfaceBlock: 2, // dirt
      probability: 0.2,
    },
    {
      name: 'plains',
      minHeight: 62,
      maxHeight: 68,
      surfaceBlock: 1, // grass
      subsurfaceBlock: 2, // dirt
      probability: 0.5,
    },
    {
      name: 'hills',
      minHeight: 69,
      maxHeight: 75,
      surfaceBlock: 3, // stone
      subsurfaceBlock: 3, // stone
      probability: 0.3,
    },
  ]

  constructor(seed: number = Math.random() * 10000) {
    this.seed = seed
    this.terrainNoise = createSeededNoise(seed)
    this.biomeNoise = createSeededNoise(seed + 1000)
  }

  // 获取高度
  getHeight(worldX: number, worldZ: number): number {
    // 使用较低的基准高度，让玩家出生在地面附近
    const baseHeight = 62
    const amplitude = 8 // 减小高度变化，创造更平坦的地形
    const scale = 50 // 更大的比例，更平缓的变化

    const noise = sampleNoise2D(this.terrainNoise, worldX, worldZ, scale)
    const height = baseHeight + (noise + 1) * 0.5 * amplitude

    return Math.floor(height)
  }

  // 获取生物群系
  getBiome(worldX: number, worldZ: number): BiomeConfig {
    const scale = 200
    const noise = sampleNoise2D(this.biomeNoise, worldX, worldZ, scale)

    // 归一化到 0-1
    const normalizedNoise = (noise + 1) * 0.5

    let cumulative = 0
    for (const biome of WorldGenerator.BIOMES) {
      cumulative += biome.probability
      if (normalizedNoise < cumulative) {
        return biome
      }
    }

    return WorldGenerator.BIOMES[WorldGenerator.BIOMES.length - 1]
  }

  // 获取指定位置的方块 ID
  getBlockAt(worldX: number, worldY: number, worldZ: number): number {
    const height = this.getHeight(worldX, worldZ)
    const biome = this.getBiome(worldX, worldZ)

    if (worldY > height) {
      return 0 // air
    }

    if (worldY === height) {
      return biome.surfaceBlock
    }

    if (worldY > height - 4) {
      return biome.subsurfaceBlock
    }

    // 深层为石头
    return 3 // stone
  }

  // 生成区块数据
  generateChunk(chunkX: number, chunkZ: number): Uint8Array {
    const blocks = new Uint8Array(GAME_CONFIG.CHUNK_SIZE * GAME_CONFIG.CHUNK_HEIGHT * GAME_CONFIG.CHUNK_SIZE)

    for (let y = 0; y < GAME_CONFIG.CHUNK_HEIGHT; y++) {
      for (let z = 0; z < GAME_CONFIG.CHUNK_SIZE; z++) {
        for (let x = 0; x < GAME_CONFIG.CHUNK_SIZE; x++) {
          const worldX = chunkX * GAME_CONFIG.CHUNK_SIZE + x
          const worldZ = chunkZ * GAME_CONFIG.CHUNK_SIZE + z
          const blockId = this.getBlockAt(worldX, y, worldZ)

          const index = (y * GAME_CONFIG.CHUNK_SIZE + z) * GAME_CONFIG.CHUNK_SIZE + x
          blocks[index] = blockId
        }
      }
    }

    return blocks
  }

  // 获取种子
  getSeed(): number {
    return this.seed
  }
}
