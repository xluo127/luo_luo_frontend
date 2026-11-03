export interface AuthUser {
  id: number
  username: string
  displayName: string
  status: string
  isAdmin: boolean
  menuKeys: string[]
  menuIds: number[]
}

export interface UserSummary extends Omit<AuthUser, 'menuKeys' | 'menuIds' | 'status'> {
  status: string
  createdAt: string
}

export interface MenuNode {
  id: number
  title: string
  url: string | null
  permissionKey: string | null
  visible: boolean
  sortOrder: number
  parentId: number | null
  children?: MenuNode[]
  clickable?: boolean
}
