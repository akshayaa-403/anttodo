import api from './client';

export interface Task {
  id: number;
  title: string;
  description?: string;
  urgency_score: number;
  mental_load: number;
  duration_minutes: number;
  deadline?: string;
  is_archived: boolean;
}

export const fetchTasks = () => api.get<Task[]>('/api/v1/tasks/').then(res => res.data);

export const createTask = (data: Partial<Task>) => api.post('/api/v1/tasks/', data);

export const updateTask = (id: number, data: Partial<Task>) => api.put(`/api/v1/tasks/${id}`, data);

export const deleteTask = (id: number) => api.delete(`/api/v1/tasks/${id}`);