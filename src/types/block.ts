export interface BlockDef {
  id: number
  name: string
  texture: string | string[]
  transparent: boolean
  solid: boolean
  gravityAffected: boolean
  hardness: number
  digTime: number
  blastResistance?: number
}
