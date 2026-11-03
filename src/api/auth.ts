import type { AuthUser } from '../types/auth'
import { api } from './learning'

export const authApi = {
  register: async (body: { username: string; password: string; displayName: string }) => (await api.post<{ user: AuthUser }>('/auth/register', body)).data.user,
  login: async (body: { username: string; password: string }) => (await api.post<{ user: AuthUser }>('/auth/login', body)).data.user,
  me: async () => (await api.get<{ user: AuthUser }>('/auth/me')).data.user,
  logout: async () => { await api.post('/auth/logout') },
}
