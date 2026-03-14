import * as THREE from 'three'
import { GAME_CONFIG } from '@/constants/config'

export class SceneManager {
  public scene: THREE.Scene
  public camera: THREE.PerspectiveCamera
  public renderer: THREE.WebGLRenderer
  public frustum: THREE.Frustum
  public clock: THREE.Clock

  private container: HTMLElement
  private cameraViewProjectionMatrix: THREE.Matrix4

  constructor(container: HTMLElement) {
    this.container = container
    this.scene = new THREE.Scene()
    this.clock = new THREE.Clock()

    const { FOV, FAR_PLANE, NEAR_PLANE } = GAME_CONFIG

    this.camera = new THREE.PerspectiveCamera(
      FOV,
      container.clientWidth / container.clientHeight,
      NEAR_PLANE,
      FAR_PLANE
    )

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    })

    this.cameraViewProjectionMatrix = new THREE.Matrix4()
    this.frustum = new THREE.Frustum()

    this.setupRenderer()
    this.setupLights()
  }

  private setupRenderer(): void {
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight)
    this.renderer.setClearColor(0x87ceeb, 1) // 天空蓝
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.shadowMap.enabled = false // Phase 4 开启
    this.container.appendChild(this.renderer.domElement)
  }

  private setupLights(): void {
    // 环境光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    this.scene.add(ambientLight)

    // 平行光（太阳）
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(100, 100, 50)
    this.scene.add(directionalLight)
  }

  public init(): void {
    this.clock.start()
    window.addEventListener('resize', this.onWindowResize.bind(this))
  }

  public getCamera(): THREE.PerspectiveCamera {
    return this.camera
  }

  public getRenderer(): THREE.WebGLRenderer {
    return this.renderer
  }

  public add(object: THREE.Object3D): void {
    this.scene.add(object)
  }

  public remove(object: THREE.Object3D): void {
    this.scene.remove(object)
  }

  public updateFrustum(): void {
    this.camera.updateMatrixWorld()
    this.cameraViewProjectionMatrix.multiplyMatrices(
      this.camera.projectionMatrix,
      this.camera.matrixWorldInverse
    )
    this.frustum.setFromProjectionMatrix(this.cameraViewProjectionMatrix)
  }

  public isVisible(position: THREE.Vector3, radius: number = 1): boolean {
    return this.frustum.intersectsSphere(new THREE.Sphere(position, radius))
  }

  public isObjectVisible(object: THREE.Object3D): boolean {
    return this.frustum.intersectsObject(object)
  }

  private onWindowResize(): void {
    const width = this.container.clientWidth
    const height = this.container.clientHeight

    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(width, height)
  }

  public render(): void {
    this.renderer.render(this.scene, this.camera)
  }

  public getDelta(): number {
    return this.clock.getDelta()
  }

  public dispose(): void {
    window.removeEventListener('resize', this.onWindowResize.bind(this))
    this.renderer.dispose()
    if (this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement)
    }
  }
}
