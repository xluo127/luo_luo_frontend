import axios from 'axios'
import type { Note, Overview, PointDetail, PointInput, QuizAttempt } from '../types/learning'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
  withCredentials: true,
  headers: { 'X-Luo-Request': '1' },
})

api.interceptors.response.use((response) => response, (error: unknown) => {
  if (axios.isAxiosError(error) && error.response?.status === 401 && !error.config?.url?.startsWith('/auth/')) {
    window.dispatchEvent(new Event('auth-expired'))
  }
  return Promise.reject(error)
})

export function errorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const message: unknown = error.response?.data?.message
    if (typeof message === 'string') return message
    if (error.response?.status === 500) return '服务暂不可用，请检查后端日志及数据库结构。'
    if (error.code === 'ECONNABORTED') return '请求超时，请稍后重试。'
    return '无法连接后端，请确认服务和 API 代理已启动。'
  }
  return error instanceof Error ? error.message : '操作失败，请重试。'
}

export const learningApi = {
  overview: async (category: string) => (await api.get<Overview>('/learning/overview', { params: category ? { category } : {} })).data,
  detail: async (id: number) => (await api.get<PointDetail>(`/learning/points/${id}`)).data,
  editor: async (id: number) => (await api.get<PointInput>(`/learning/points/${id}/editor`)).data,
  create: async (body: PointInput) => (await api.post<{ id: number; categoryId: number }>('/learning/points', body)).data,
  update: async (id: number, body: PointInput) => (await api.put(`/learning/points/${id}`, body)).data,
  note: async (id: number, body: Note) => (await api.put<Note>(`/learning/points/${id}/note`, body)).data,
  progress: async (id: number, progress: number) => (await api.patch(`/learning/points/${id}/progress`, { progress })).data,
  quiz: async (id: number, answers: Record<number, string>) => (await api.post<QuizAttempt>(`/learning/points/${id}/quiz`, { answers })).data,
}
