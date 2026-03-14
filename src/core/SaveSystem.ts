import type { Chunk } from './Chunk'

// 存档数据结构
export interface SaveData {
  version: number
  timestamp: number
  player: PlayerSaveData
  chunks: ChunkSaveData[]
}

export interface PlayerSaveData {
  position: { x: number; y: number; z: number }
  rotation: { x: number; y: number }
  health: number
  inventory: Array<{ blockId: number; count: number }>
  selectedSlot: number
}

export interface ChunkSaveData {
  x: number
  z: number
  blocks: number[] // 压缩后的方块数据
}

const SAVE_VERSION = 1
const DB_NAME = 'minecraft_vue3_save'
const DB_VERSION = 1
const STORE_NAME = 'saves'

export class SaveSystem {
  private db: IDBDatabase | null = null

  // 初始化数据库
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        }
      }
    })
  }

  // 保存游戏
  async save(
    playerData: PlayerSaveData,
    chunks: Map<string, Chunk>
  ): Promise<void> {
    if (!this.db) await this.init()

    const chunkSaveData: ChunkSaveData[] = []
    for (const chunk of chunks.values()) {
      // 只保存修改过的区块
      if (chunk.modified) {
        chunkSaveData.push({
          x: chunk.x,
          z: chunk.z,
          blocks: Array.from(chunk.blocks),
        })
      }
    }

    const saveData: SaveData = {
      version: SAVE_VERSION,
      timestamp: Date.now(),
      player: playerData,
      chunks: chunkSaveData,
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.put({ id: 'game_save', data: saveData })

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  // 加载游戏
  async load(): Promise<SaveData | null> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.get('game_save')

      request.onsuccess = () => {
        if (request.result) {
          resolve(request.result.data)
        } else {
          resolve(null)
        }
      }
      request.onerror = () => reject(request.error)
    })
  }

  // 删除存档
  async delete(): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.delete('game_save')

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  // 检查是否有存档
  async hasSave(): Promise<boolean> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(STORE_NAME, 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.get('game_save')

      request.onsuccess = () => {
        resolve(!!request.result)
      }
      request.onerror = () => reject(request.error)
    })
  }

  // 获取存档时间
  async getSaveTimestamp(): Promise<number | null> {
    const saveData = await this.load()
    return saveData?.timestamp ?? null
  }

  // 关闭数据库
  close(): void {
    if (this.db) {
      this.db.close()
      this.db = null
    }
  }
}

// 全局存档系统实例
let saveSystem: SaveSystem | null = null

export function getSaveSystem(): SaveSystem {
  if (!saveSystem) {
    saveSystem = new SaveSystem()
  }
  return saveSystem
}

// 快速保存函数
export async function quickSave(
  playerData: PlayerSaveData,
  chunks: Map<string, Chunk>
): Promise<void> {
  const system = getSaveSystem()
  await system.save(playerData, chunks)
}

// 快速加载函数
export async function quickLoad(): Promise<SaveData | null> {
  const system = getSaveSystem()
  return await system.load()
}
