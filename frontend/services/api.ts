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
};

export const tasksAPI = {
  getAll: () => api.get('/tasks'),
  create: (titulo: string) =>
    api.post('/tasks', { titulo }),
  toggle: (id: number, completada: boolean) =>
    api.put(`/tasks/${id}`, { completada }),
  edit: (id: number, titulo: string) =>
    api.put(`/tasks/${id}`, { titulo }),
  remove: (id: number) =>
    api.delete(`/tasks/${id}`),
};