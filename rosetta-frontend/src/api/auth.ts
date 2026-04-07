import { api } from './client'

export interface AuthResponse {
  accessToken: string
  refreshToken: string
}

export const authApi = {
  register: (email: string, password: string) =>
    api.post<AuthResponse>('/api/auth/register', { email, password }),

  login: (email: string, password: string) =>
    api.post<AuthResponse>('/api/auth/login', { email, password }),

  logout: () => api.post('/api/auth/logout'),
}
