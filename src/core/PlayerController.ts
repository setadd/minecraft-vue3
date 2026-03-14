import * as THREE from 'three'
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js'
import { GAME_CONFIG } from '@/constants/config'
import type { PlayerInput } from '@/types'
import type { CollisionDetector } from './CollisionDetector'
import type { ChunkManager } from './ChunkManager'
import { getAudioSystem } from './AudioSystem'

export class PlayerController {
  public position: THREE.Vector3
  public velocity: THREE.Vector3
  public rotation: { x: number; y: number }

  private camera: THREE.PerspectiveCamera
  private controls: PointerLockControls
  private input: PlayerInput
  private collisionDetector: CollisionDetector | null = null
  private chunkManager: ChunkManager | null = null
  private audioSystem = getAudioSystem()

  private lastStepPosition: THREE.Vector3 = new THREE.Vector3()
  private readonly STEP_DISTANCE = 0.5 // 步幅距离检测

  private readonly GRAVITY = GAME_CONFIG.GRAVITY
  private readonly WALK_SPEED = GAME_CONFIG.WALK_SPEED
  private readonly JUMP_FORCE = GAME_CONFIG.JUMP_FORCE
  private readonly PLAYER_HEIGHT = GAME_CONFIG.PLAYER_HEIGHT
  private readonly FLY_SPEED = 15 // 飞行速度

  public onGround: boolean = false
  public isFlying: boolean = false

  constructor(
    camera: THREE.PerspectiveCamera,
    container: HTMLElement,
    collisionDetector?: CollisionDetector,
    chunkManager?: ChunkManager,
    startPos?: { x: number; y: number; z: number }
  ) {
    this.camera = camera
    this.controls = new PointerLockControls(camera, container)
    this.collisionDetector = collisionDetector || null
    this.chunkManager = chunkManager || null

    // 设置初始位置
    this.position = new THREE.Vector3(startPos?.x ?? 0, startPos?.y ?? 80, startPos?.z ?? 0)
    this.controls.getObject().position.copy(this.position)
    this.lastStepPosition.copy(this.position)
    this.velocity = new THREE.Vector3()
    this.rotation = { x: 0, y: 0 }
    this.input = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      jump: false,
      sprint: false,
    }

    this.bindInputEvents(container)
  }

  private bindInputEvents(container: HTMLElement): void {
    document.addEventListener('keydown', this.onKeyDown.bind(this))
    document.addEventListener('keyup', this.onKeyUp.bind(this))

    container.addEventListener('click', () => {
      if (!this.controls.isLocked) {
        this.controls.lock()
      }
    })
  }

  private onKeyDown(event: KeyboardEvent): void {
    switch (event.code) {
      case 'KeyW': this.input.forward = true; break
      case 'KeyS': this.input.backward = true; break
      case 'KeyA': this.input.left = true; break
      case 'KeyD': this.input.right = true; break
      case 'Space': this.input.jump = true; break
      case 'ShiftLeft': this.input.sprint = true; break
    }
  }

  private onKeyUp(event: KeyboardEvent): void {
    switch (event.code) {
      case 'KeyW': this.input.forward = false; break
      case 'KeyS': this.input.backward = false; break
      case 'KeyA': this.input.left = false; break
      case 'KeyD': this.input.right = false; break
      case 'Space': this.input.jump = false; break
      case 'ShiftLeft': this.input.sprint = false; break
    }
  }

  public getInput(): PlayerInput { return { ...this.input } }

  // 处理键盘输入
  handleInput(code: string, isPressed: boolean): void {
    switch (code) {
      case 'KeyW': this.input.forward = isPressed; break
      case 'KeyS': this.input.backward = isPressed; break
      case 'KeyA': this.input.left = isPressed; break
      case 'KeyD': this.input.right = isPressed; break
      case 'Space': this.input.jump = isPressed; break
      case 'ShiftLeft': this.input.sprint = isPressed; break
    }
  }

  public update(delta: number): void {
    this.rotation.y = this.controls.getObject().rotation.y
    this.rotation.x = this.camera.rotation.x

    // 存储旧位置用于碰撞恢复
    const oldPosition = this.controls.getObject().position.clone()
    const currentPos = this.controls.getObject().position

    // 飞行模式：禁用重力，使用飞行速度
    if (this.isFlying) {
      this.velocity.y = 0
      this.handleFlying(delta, currentPos)
      this.onGround = false
    } else {
      // 应用重力（先于移动，这样跳跃会立即有速度）
      if (!this.onGround) {
        this.velocity.y -= this.GRAVITY * delta
      }

      this.updateMovement(delta)

      // 应用垂直移动
      currentPos.y += this.velocity.y * delta

      // 强制地面约束：防止穿透方块
      let forcedGround = false
      if (this.collisionDetector && this.chunkManager) {
        // 获取当前 XZ 位置的地面高度
        const groundY = this.collisionDetector.getGroundHeight(
          currentPos.x,
          currentPos.z,
          currentPos.y
        )
        // 玩家脚部应该在方块顶部
        const minFootY = groundY
        const minPlayerY = minFootY + this.PLAYER_HEIGHT

        // 如果玩家低于地面且向下运动，强制抬起
        if (currentPos.y < minPlayerY && groundY > 0 && this.velocity.y <= 0) {
          currentPos.y = minPlayerY
          this.velocity.y = 0
          forcedGround = true
        }
      }

      // 碰撞检测
      if (this.collisionDetector) {
        const collision = this.collisionDetector.checkCollision(currentPos)

        if (collision.isColliding && collision.normal) {
          // 检测碰撞方向
          const isVerticalCollision = Math.abs(collision.normal.y) > 0.5
          const isHorizontalCollision = Math.abs(collision.normal.x) > 0.5 || Math.abs(collision.normal.z) > 0.5

          // 垂直碰撞（头顶或脚下）
          if (isVerticalCollision) {
            // 如果法线向下（normal.y < 0），说明站在方块上
            if (collision.normal.y < 0 && this.velocity.y <= 0) {
              forcedGround = true
              this.velocity.y = 0
              // 将玩家推到方块顶部
              const footY = currentPos.y - this.PLAYER_HEIGHT
              const blockTopY = Math.ceil(footY)
              const targetY = blockTopY + this.PLAYER_HEIGHT
              if (currentPos.y < targetY) {
                currentPos.y = targetY
              }
            }
            // 如果法线向上（normal.y > 0），说明头顶撞到方块
            else if (collision.normal.y > 0 && this.velocity.y > 0) {
              this.velocity.y = 0
            }
          }

          // 水平碰撞（撞墙）- 恢复水平位置
          if (isHorizontalCollision) {
            // 只恢复水平位置，不影响垂直位置
            currentPos.x = oldPosition.x
            currentPos.z = oldPosition.z
            this.velocity.x = 0
            this.velocity.z = 0
          }
        } else {
          // 无碰撞时，使用 isOnGround 检测
          this.onGround = this.collisionDetector.isOnGround(currentPos)
        }

        // 强制地面或碰撞接触时，设置 onGround
        if (forcedGround) {
          this.onGround = true
        }
      } else {
        // 简单地面检测（向后兼容）
        if (currentPos.y < this.PLAYER_HEIGHT) {
          currentPos.y = this.PLAYER_HEIGHT
          this.velocity.y = 0
          this.onGround = true
        } else {
          this.onGround = false
        }
      }
    }

    this.position.copy(currentPos)

    // 播放脚步声（移动时）
    this.playStepSound()

    // 更新最后位置
    this.lastStepPosition.copy(this.position)
  }

  // 播放脚步声
  private playStepSound(): void {
    if (!this.onGround || !this.chunkManager) return

    // 检测移动距离
    const distance = this.position.distanceTo(this.lastStepPosition)
    if (distance < this.STEP_DISTANCE) return

    // 获取脚下方块
    const blockX = Math.floor(this.position.x)
    const blockY = Math.floor(this.position.y - this.PLAYER_HEIGHT)
    const blockZ = Math.floor(this.position.z)
    const blockId = this.chunkManager.getBlock(blockX, blockY, blockZ)

    this.audioSystem.playStep(blockId)
  }

  private updateMovement(delta: number): void {
    const speed = this.input.sprint ? this.WALK_SPEED * 1.3 : this.WALK_SPEED
    const direction = new THREE.Vector3()

    // W 向前=-1, S 向后=1, A 向左=-1, D 向右=1
    if (this.input.forward || this.input.backward) direction.z = this.input.forward ? -1 : 1
    if (this.input.left || this.input.right) direction.x = this.input.left ? -1 : 1

    if (direction.length() > 0) {
      direction.normalize()
      const yaw = this.rotation.y

      // 计算相对于视角方向的移动向量
      // moveForward 沿 Z 轴移动（视角方向），moveRight 沿 X 轴移动（横向）
      const moveForwardAmount = -direction.z
      const moveRightAmount = direction.x

      this.controls.moveForward(moveForwardAmount * speed * delta)
      this.controls.moveRight(moveRightAmount * speed * delta)
    }

    if (this.input.jump && this.onGround) {
      this.velocity.y = this.JUMP_FORCE
      this.onGround = false
    }
  }

  // 飞行模式处理
  private handleFlying(delta: number, currentPos: THREE.Vector3): void {
    const direction = new THREE.Vector3()

    // W 向前=-1, S 向后=1, A 向左=-1, D 向右=1
    if (this.input.forward || this.input.backward) direction.z = this.input.forward ? -1 : 1
    if (this.input.left || this.input.right) direction.x = this.input.left ? -1 : 1

    // 空格上升，Shift 下降
    let verticalSpeed = 0
    if (this.input.jump) verticalSpeed = 1
    if (this.input.sprint) verticalSpeed = -1

    if (direction.length() > 0 || verticalSpeed !== 0) {
      direction.normalize()
      const yaw = this.rotation.y

      // 计算移动向量
      const moveForwardAmount = -direction.z
      const moveRightAmount = direction.x

      // 水平移动
      this.controls.moveForward(moveForwardAmount * this.FLY_SPEED * delta)
      this.controls.moveRight(moveRightAmount * this.FLY_SPEED * delta)

      // 垂直移动
      currentPos.y += verticalSpeed * this.FLY_SPEED * delta
    }
  }

  // 切换飞行模式
  public toggleFlying(): void {
    this.isFlying = !this.isFlying
    if (this.isFlying) {
      this.velocity.y = 0
    }
  }

  public getEyePosition(): THREE.Vector3 {
    return this.controls.getObject().position.clone()
  }

  public getViewDirection(): THREE.Vector3 {
    const direction = new THREE.Vector3(0, 0, -1)
    direction.applyQuaternion(this.camera.quaternion)
    return direction
  }

  public lock(): void { this.controls.lock() }
  public unlock(): void { this.controls.unlock() }
  public isLocked(): boolean { return this.controls.isLocked }

  public dispose(): void {
    this.controls.unlock()
  }
}
