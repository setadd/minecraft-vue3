import * as THREE from 'three'

// 纹理配置
const TEXTURE_SIZE = 16 // 纹理大小 16x16

// 生成程序化纹理
export class TextureManager {
  private textures: Map<string, THREE.CanvasTexture> = new Map()
  private uvMapping: Map<number, THREE.Vector4> = new Map()

  constructor() {
    this.generateAllTextures()
  }

  // 生成所有方块纹理
  private generateAllTextures(): void {
    // 草地顶部
    this.createTexture('grass_top', this.createGrassTopPattern())
    // 草地侧面
    this.createTexture('grass_side', this.createGrassSidePattern())
    // 泥土
    this.createTexture('dirt', this.createDirtPattern())
    // 石头
    this.createTexture('stone', this.createStonePattern())
    // 木头侧面
    this.createTexture('wood_side', this.createWoodSidePattern())
    // 树叶
    this.createTexture('leaves', this.createLeavesPattern())
    // 沙子
    this.createTexture('sand', this.createSandPattern())
    // 玻璃
    this.createTexture('glass', this.createGlassPattern())
    // 砖块
    this.createTexture('brick', this.createBrickPattern())
    // 煤矿矿石
    this.createTexture('coal_ore', this.createCoalOrePattern())
    // 基岩
    this.createTexture('bedrock', this.createBedrockPattern())
  }

  // 创建纹理
  private createTexture(name: string, pixels: Uint8ClampedArray): void {
    const canvas = document.createElement('canvas')
    canvas.width = TEXTURE_SIZE
    canvas.height = TEXTURE_SIZE
    const ctx = canvas.getContext('2d')!
    const imageData = ctx.createImageData(TEXTURE_SIZE, TEXTURE_SIZE)
    imageData.data.set(pixels)
    ctx.putImageData(imageData, 0, 0)

    const texture = new THREE.CanvasTexture(canvas)
    texture.magFilter = THREE.NearestFilter
    texture.minFilter = THREE.NearestFilter
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping

    this.textures.set(name, texture)
  }

  // 获取纹理
  getTexture(name: string): THREE.CanvasTexture | undefined {
    return this.textures.get(name)
  }

  // 获取方块的 UV 映射（用于纹理图集）
  getBlockUV(blockId: number): THREE.Vector4 | undefined {
    return this.uvMapping.get(blockId)
  }

  // ==================== 纹理生成函数 ====================

  // 草地顶部（绿色带噪点）
  private createGrassTopPattern(): Uint8ClampedArray {
    const pixels = new Uint8ClampedArray(TEXTURE_SIZE * TEXTURE_SIZE * 4)
    for (let y = 0; y < TEXTURE_SIZE; y++) {
      for (let x = 0; x < TEXTURE_SIZE; x++) {
        const i = (y * TEXTURE_SIZE + x) * 4
        const noise = Math.random() * 30 - 15
        pixels[i] = 86 + noise     // R
        pixels[i + 1] = 125 + noise // G
        pixels[i + 2] = 70 + noise  // B
        pixels[i + 3] = 255         // A
      }
    }
    return pixels
  }

  // 草地侧面（顶部绿色，下面泥土色）
  private createGrassSidePattern(): Uint8ClampedArray {
    const pixels = new Uint8ClampedArray(TEXTURE_SIZE * TEXTURE_SIZE * 4)
    for (let y = 0; y < TEXTURE_SIZE; y++) {
      for (let x = 0; x < TEXTURE_SIZE; x++) {
        const i = (y * TEXTURE_SIZE + x) * 4
        if (y < 4) {
          // 顶部绿色
          const noise = Math.random() * 20 - 10
          pixels[i] = 86 + noise
          pixels[i + 1] = 125 + noise
          pixels[i + 2] = 70 + noise
        } else {
          // 下面泥土色
          const noise = Math.random() * 20 - 10
          pixels[i] = 139 + noise
          pixels[i + 1] = 90 + noise
          pixels[i + 2] = 43 + noise
        }
        pixels[i + 3] = 255
      }
    }
    return pixels
  }

  // 泥土（棕色带噪点）
  private createDirtPattern(): Uint8ClampedArray {
    const pixels = new Uint8ClampedArray(TEXTURE_SIZE * TEXTURE_SIZE * 4)
    for (let y = 0; y < TEXTURE_SIZE; y++) {
      for (let x = 0; x < TEXTURE_SIZE; x++) {
        const i = (y * TEXTURE_SIZE + x) * 4
        const noise = Math.random() * 30 - 15
        pixels[i] = 139 + noise
        pixels[i + 1] = 90 + noise
        pixels[i + 2] = 43 + noise
        pixels[i + 3] = 255
      }
    }
    return pixels
  }

  // 石头（灰色带噪点）
  private createStonePattern(): Uint8ClampedArray {
    const pixels = new Uint8ClampedArray(TEXTURE_SIZE * TEXTURE_SIZE * 4)
    for (let y = 0; y < TEXTURE_SIZE; y++) {
      for (let x = 0; x < TEXTURE_SIZE; x++) {
        const i = (y * TEXTURE_SIZE + x) * 4
        const noise = Math.random() * 40 - 20
        pixels[i] = 128 + noise
        pixels[i + 1] = 128 + noise
        pixels[i + 2] = 128 + noise
        pixels[i + 3] = 255
      }
    }
    return pixels
  }

  // 木头侧面（垂直纹理）
  private createWoodSidePattern(): Uint8ClampedArray {
    const pixels = new Uint8ClampedArray(TEXTURE_SIZE * TEXTURE_SIZE * 4)
    for (let y = 0; y < TEXTURE_SIZE; y++) {
      for (let x = 0; x < TEXTURE_SIZE; x++) {
        const i = (y * TEXTURE_SIZE + x) * 4
        // 垂直条纹
        const stripe = (x % 4) < 2 ? 10 : -10
        pixels[i] = 101 + stripe
        pixels[i + 1] = 67 + stripe
        pixels[i + 2] = 33 + stripe
        pixels[i + 3] = 255
      }
    }
    return pixels
  }

  // 树叶（深绿色带透明感）
  private createLeavesPattern(): Uint8ClampedArray {
    const pixels = new Uint8ClampedArray(TEXTURE_SIZE * TEXTURE_SIZE * 4)
    for (let y = 0; y < TEXTURE_SIZE; y++) {
      for (let x = 0; x < TEXTURE_SIZE; x++) {
        const i = (y * TEXTURE_SIZE + x) * 4
        const noise = Math.random() * 40 - 20
        pixels[i] = 34 + noise
        pixels[i + 1] = 139 + noise
        pixels[i + 2] = 34 + noise
        pixels[i + 3] = 255
      }
    }
    return pixels
  }

  // 沙子（浅黄色带噪点）
  private createSandPattern(): Uint8ClampedArray {
    const pixels = new Uint8ClampedArray(TEXTURE_SIZE * TEXTURE_SIZE * 4)
    for (let y = 0; y < TEXTURE_SIZE; y++) {
      for (let x = 0; x < TEXTURE_SIZE; x++) {
        const i = (y * TEXTURE_SIZE + x) * 4
        const noise = Math.random() * 30 - 15
        pixels[i] = 244 + noise
        pixels[i + 1] = 228 + noise
        pixels[i + 2] = 169 + noise
        pixels[i + 3] = 255
      }
    }
    return pixels
  }

  // 玻璃（浅蓝色半透明）
  private createGlassPattern(): Uint8ClampedArray {
    const pixels = new Uint8ClampedArray(TEXTURE_SIZE * TEXTURE_SIZE * 4)
    for (let y = 0; y < TEXTURE_SIZE; y++) {
      for (let x = 0; x < TEXTURE_SIZE; x++) {
        const i = (y * TEXTURE_SIZE + x) * 4
        pixels[i] = 168
        pixels[i + 1] = 213
        pixels[i + 2] = 226
        pixels[i + 3] = 100 // 半透明
      }
    }
    return pixels
  }

  // 砖块（红色带砖缝）
  private createBrickPattern(): Uint8ClampedArray {
    const pixels = new Uint8ClampedArray(TEXTURE_SIZE * TEXTURE_SIZE * 4)
    for (let y = 0; y < TEXTURE_SIZE; y++) {
      for (let x = 0; x < TEXTURE_SIZE; x++) {
        const i = (y * TEXTURE_SIZE + x) * 4
        // 砖缝
        if (y % 4 === 0 || (x % 8 === 0 && y % 8 < 4) || (x % 8 === 7 && y % 8 >= 4)) {
          pixels[i] = 80
          pixels[i + 1] = 60
          pixels[i + 2] = 50
        } else {
          pixels[i] = 139
          pixels[i + 1] = 50
          pixels[i + 2] = 50
        }
        pixels[i + 3] = 255
      }
    }
    return pixels
  }

  // 煤矿矿石（石头底色 + 黑色斑点）
  private createCoalOrePattern(): Uint8ClampedArray {
    const pixels = new Uint8ClampedArray(TEXTURE_SIZE * TEXTURE_SIZE * 4)
    for (let y = 0; y < TEXTURE_SIZE; y++) {
      for (let x = 0; x < TEXTURE_SIZE; x++) {
        const i = (y * TEXTURE_SIZE + x) * 4
        const noise = Math.random() * 30 - 15
        // 黑色斑点
        const isCoal = Math.random() < 0.15
        if (isCoal) {
          pixels[i] = 30 + noise
          pixels[i + 1] = 30 + noise
          pixels[i + 2] = 30 + noise
        } else {
          pixels[i] = 80 + noise
          pixels[i + 1] = 80 + noise
          pixels[i + 2] = 80 + noise
        }
        pixels[i + 3] = 255
      }
    }
    return pixels
  }

  // 基岩（深灰色带噪点）
  private createBedrockPattern(): Uint8ClampedArray {
    const pixels = new Uint8ClampedArray(TEXTURE_SIZE * TEXTURE_SIZE * 4)
    for (let y = 0; y < TEXTURE_SIZE; y++) {
      for (let x = 0; x < TEXTURE_SIZE; x++) {
        const i = (y * TEXTURE_SIZE + x) * 4
        const noise = Math.random() * 20 - 10
        pixels[i] = 26 + noise
        pixels[i + 1] = 26 + noise
        pixels[i + 2] = 26 + noise
        pixels[i + 3] = 255
      }
    }
    return pixels
  }
}

// 全局纹理管理器实例
let textureManager: TextureManager | null = null

export function getTextureManager(): TextureManager {
  if (!textureManager) {
    textureManager = new TextureManager()
  }
  return textureManager
}
