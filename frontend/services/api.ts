import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const BASE =
  Platform.OS === 'android'
    ? 'http://10.0.2.2:3000/api'
    : 'http://localhost:3000/api';

export const api = axios.create({ baseURL: BASE, timeout: 5000 });

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  register: (email: string, pass: string) =>
    api.post<{ id: number; email: string }>('/auth/register', { email, password: pass }),
  login: (email: string, pass: string) =>
    api.post<{ token: string }>('/auth/login', { email, password: pass }),
  getMe: () =>
    api.get<{ id: number; email: string; avatar: string | null }>('/auth/me'),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.put('/auth/password', { currentPassword, newPassword }),
  changeEmail: (newEmail: string, password: string) =>
    api.put<{ ok: boolean; email: string }>('/auth/email', { newEmail, password }),
  updateAvatar: (avatar: string) =>
    api.put('/auth/avatar', { avatar }, { timeout: 30000 }),
  deleteAccount: (password: string) =>
    api.delete('/auth/account', { data: { password } }),
};

export const tasksAPI = {
  getAll: () => api.get('/tasks'),
  create: (titulo: string) =>
    api.post('/tasks', { titulo }),
  toggle: (id: number, completada: boolean) =>
    api.put(`/tasks/${id}`, { completada }),
  edit: (id: number, titulo: string, prioridad: string | null, tiempoLimite: number | null) =>
    api.put(`/tasks/${id}`, { titulo, prioridad, tiempo_limite: tiempoLimite }),
  remove: (id: number) =>
    api.delete(`/tasks/${id}`),
};