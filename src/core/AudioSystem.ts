// 音效类型
export type SoundType =
  | 'step_grass'
  | 'step_stone'
  | 'step_wood'
  | 'step_sand'
  | 'dig_grass'
  | 'dig_stone'
  | 'dig_wood'
  | 'dig_sand'
  | 'place_grass'
  | 'place_stone'
  | 'place_wood'
  | 'place_sand'
  | 'jump'
  | 'break'

// 音效配置
interface SoundConfig {
  volume: number
  pitch: number
  pitchVariation: number
}

const DEFAULT_SOUND_CONFIG: Record<SoundType, SoundConfig> = {
  step_grass: { volume: 0.3, pitch: 1.0, pitchVariation: 0.1 },
  step_stone: { volume: 0.4, pitch: 1.2, pitchVariation: 0.15 },
  step_wood: { volume: 0.35, pitch: 0.9, pitchVariation: 0.1 },
  step_sand: { volume: 0.25, pitch: 0.8, pitchVariation: 0.1 },
  dig_grass: { volume: 0.5, pitch: 1.0, pitchVariation: 0.2 },
  dig_stone: { volume: 0.6, pitch: 1.3, pitchVariation: 0.2 },
  dig_wood: { volume: 0.45, pitch: 0.9, pitchVariation: 0.15 },
  dig_sand: { volume: 0.35, pitch: 0.7, pitchVariation: 0.1 },
  place_grass: { volume: 0.4, pitch: 1.0, pitchVariation: 0.1 },
  place_stone: { volume: 0.5, pitch: 1.2, pitchVariation: 0.15 },
  place_wood: { volume: 0.4, pitch: 0.9, pitchVariation: 0.1 },
  place_sand: { volume: 0.3, pitch: 0.8, pitchVariation: 0.1 },
  jump: { volume: 0.3, pitch: 1.0, pitchVariation: 0.1 },
  break: { volume: 0.5, pitch: 1.0, pitchVariation: 0.2 },
}

export class AudioSystem {
  private audioContext: AudioContext | null = null
  private masterGain: GainNode | null = null
  private soundConfig: Record<SoundType, SoundConfig>
  private enabled: boolean = true
  private lastStepTime: number = 0
  private readonly STEP_COOLDOWN = 0.3 // 脚步声冷却时间（秒）

  constructor() {
    this.soundConfig = { ...DEFAULT_SOUND_CONFIG }
  }

  // 初始化音频系统
  init(): void {
    if (this.audioContext) return

    try {
      this.audioContext = new AudioContext()
      this.masterGain = this.audioContext.createGain()
      this.masterGain.connect(this.audioContext.destination)
      this.masterGain.gain.value = 0.5 // 主音量
    } catch (e) {
      console.warn('Web Audio API not supported')
      this.enabled = false
    }
  }

  // 播放音效
  play(soundType: SoundType): void {
    if (!this.enabled || !this.audioContext || !this.masterGain) return

    const config = this.soundConfig[soundType]
    if (!config) return

    // 创建振荡器生成程序化音效
    const oscillator = this.audioContext.createOscillator()
    const gainNode = this.audioContext.createGain()

    // 根据音效类型选择波形
    if (soundType.includes('step')) {
      oscillator.type = 'square'
    } else if (soundType.includes('dig') || soundType.includes('break')) {
      oscillator.type = 'sawtooth'
    } else if (soundType.includes('place')) {
      oscillator.type = 'sine'
    } else {
      oscillator.type = 'triangle'
    }

    // 设置音高（带随机变化）
    const pitchVariation = (Math.random() - 0.5) * 2 * config.pitchVariation
    const frequency = 200 * config.pitch * (1 + pitchVariation)
    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime)

    // 音量包络
    const now = this.audioContext.currentTime
    gainNode.gain.setValueAtTime(0, now)
    gainNode.gain.linearRampToValueAtTime(config.volume, now + 0.01)
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1)

    // 连接节点
    oscillator.connect(gainNode)
    gainNode.connect(this.masterGain)

    // 播放
    oscillator.start(now)
    oscillator.stop(now + 0.15)
  }

  // 播放脚步声（带冷却）
  playStep(blockId: number): void {
    const now = Date.now() / 1000
    if (now - this.lastStepTime < this.STEP_COOLDOWN) return

    const soundType = this.getSoundTypeForBlock(blockId, 'step')
    this.play(soundType)
    this.lastStepTime = now
  }

  // 播放挖掘音效
  playDig(blockId: number): void {
    const soundType = this.getSoundTypeForBlock(blockId, 'dig')
    this.play(soundType)
  }

  // 播放放置音效
  playPlace(blockId: number): void {
    const soundType = this.getSoundTypeForBlock(blockId, 'place')
    this.play(soundType)
  }

  // 播放跳跃音效
  playJump(): void {
    this.play('jump')
  }

  // 播放破坏音效
  playBreak(): void {
    this.play('break')
  }

  // 根据方块 ID 获取音效类型
  private getSoundTypeForBlock(
    blockId: number,
    prefix: 'step' | 'dig' | 'place'
  ): SoundType {
    // 根据方块类型选择音效材质
    if ([1, 2].includes(blockId)) {
      return `${prefix}_grass` as SoundType
    } else if ([3, 9, 10].includes(blockId)) {
      return `${prefix}_stone` as SoundType
    } else if ([4].includes(blockId)) {
      return `${prefix}_wood` as SoundType
    } else if ([6].includes(blockId)) {
      return `${prefix}_sand` as SoundType
    }
    return `${prefix}_stone` as SoundType
  }

  // 设置主音量
  setMasterVolume(volume: number): void {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, volume))
    }
  }

  // 启用/禁用音效
  setEnabled(enabled: boolean): void {
    this.enabled = enabled
    if (this.audioContext) {
      if (enabled) {
        this.audioContext.resume()
      } else {
        this.audioContext.suspend()
      }
    }
  }

  // 清理资源
  dispose(): void {
    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
      this.masterGain = null
    }
  }
}

// 全局音频系统实例
let audioSystem: AudioSystem | null = null

export function getAudioSystem(): AudioSystem {
  if (!audioSystem) {
    audioSystem = new AudioSystem()
  }
  return audioSystem
}
