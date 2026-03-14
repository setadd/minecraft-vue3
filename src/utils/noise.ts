// 自定义带种子的 Perlin 噪声实现
class SeededNoise {
  private p: number[]

  constructor(seed: number) {
    // 使用种子生成置换表
    const perm = this.generatePermutation(seed)
    this.p = [...perm, ...perm]
  }

  // 生成置换表
  private generatePermutation(seed: number): number[] {
    const perm = new Array(256).fill(0).map((_, i) => i)

    // Fisher-Yates 洗牌算法
    let random = this.seededRandom(seed)
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(random() * (i + 1))
      ;[perm[i], perm[j]] = [perm[j], perm[i]]
    }

    return perm
  }

  // 简单的伪随机数生成器
  private seededRandom(seed: number): () => number {
    let s = seed >>> 0
    return () => {
      s = (s * 1664525 + 1013904223) >>> 0
      return s / 4294967296
    }
  }

  // 噪声采样
  noise(x: number, y: number, z: number): number {
    const floorX = Math.floor(x)
    const floorY = Math.floor(y)
    const floorZ = Math.floor(z)

    const X = floorX & 255
    const Y = floorY & 255
    const Z = floorZ & 255

    x -= floorX
    y -= floorY
    z -= floorZ

    const xMinus1 = x - 1
    const yMinus1 = y - 1
    const zMinus1 = z - 1

    const u = this.fade(x)
    const v = this.fade(y)
    const w = this.fade(z)

    const A = this.p[X] + Y
    const AA = this.p[A] + Z
    const AB = this.p[A + 1] + Z
    const B = this.p[X + 1] + Y
    const BA = this.p[B] + Z
    const BB = this.p[B + 1] + Z

    return this.lerp(
      w,
      this.lerp(
        v,
        this.lerp(u, this.grad(this.p[AA], x, y, z), this.grad(this.p[BA], xMinus1, y, z)),
        this.lerp(u, this.grad(this.p[AB], x, yMinus1, z), this.grad(this.p[BB], xMinus1, yMinus1, z))
      ),
      this.lerp(
        v,
        this.lerp(u, this.grad(this.p[AA + 1], x, y, zMinus1), this.grad(this.p[BA + 1], xMinus1, y, zMinus1)),
        this.lerp(u, this.grad(this.p[AB + 1], x, yMinus1, zMinus1), this.grad(this.p[BB + 1], xMinus1, yMinus1, zMinus1))
      )
    )
  }

  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10)
  }

  private lerp(t: number, a: number, b: number): number {
    return a + t * (b - a)
  }

  private grad(hash: number, x: number, y: number, z: number): number {
    const h = hash & 15
    const u = h < 8 ? x : y
    const v = h < 4 ? y : h === 12 || h === 14 ? x : z
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v)
  }
}

export type { SeededNoise as ImprovedNoise }

// 噪声函数类型
export type NoiseFunction = SeededNoise

// 创建带种子的噪声
export function createSeededNoise(seed: number): SeededNoise {
  return new SeededNoise(seed)
}

// 2D 噪声采样
export function sampleNoise2D(
  noise: SeededNoise,
  x: number,
  z: number,
  scale: number
): number {
  return noise.noise(x / scale, 0, z / scale)
}

// 多层噪声叠加 (FBM)
export function fbm(
  noise: SeededNoise,
  x: number,
  z: number,
  octaves: number = 4,
  lacunarity: number = 2,
  persistence: number = 0.5
): number {
  let value = 0
  let amplitude = 1
  let frequency = 1
  let maxValue = 0

  for (let i = 0; i < octaves; i++) {
    value += amplitude * sampleNoise2D(noise, x * frequency, z * frequency, 1)
    maxValue += amplitude
    amplitude *= persistence
    frequency *= lacunarity
  }

  return value / maxValue
}

// 噪声值插值
export function lerpNoise(a: number, b: number, t: number): number {
  return a + (b - a) * t
}
