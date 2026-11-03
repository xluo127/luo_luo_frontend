import type { MenuNode, UserSummary } from '../types/auth'
import { api } from './learning'

export const permissionApi = {
  users: async () => (await api.get<UserSummary[]>('/users')).data,
  deleteUser: async (id: number) => (await api.delete(`/users/${id}`)).data,
  menus: async () => (await api.get<{ items: MenuNode[]; flat: MenuNode[] }>('/permissions/menus')).data,
  createMenu: async (body: { title: string; permissionKey: string; url: string | null; parentId: number | null; sortOrder: number; visible: boolean }) => (await api.post<MenuNode>('/permissions/menus', body)).data,
  updateMenu: async (id: number, body: { title: string; permissionKey: string; url: string | null; parentId: number | null; sortOrder: number; visible: boolean }) => (await api.put<MenuNode>(`/permissions/menus/${id}`, body)).data,
  deleteMenu: async (id: number) => (await api.delete(`/permissions/menus/${id}`)).data,
  userMenus: async (id: number) => (await api.get<{ menuIds: number[] }>(`/permissions/users/${id}/menus`)).data,
  setUserMenus: async (id: number, menuIds: number[]) => (await api.put<{ menuIds: number[] }>(`/permissions/users/${id}/menus`, { menuIds })).data,
}
