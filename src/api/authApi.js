import { apiFetch } from './http'

export const login = (payload) => apiFetch('/api/auth/login', { method: 'POST', body: payload })

export const register = (payload) => apiFetch('/api/auth/register', { method: 'POST', body: payload })

export const logout = () => apiFetch('/api/auth/logout', { method: 'POST' })

