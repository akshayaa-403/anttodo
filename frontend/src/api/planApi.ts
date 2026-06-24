import api from './client';

export interface PlanResponse {
  order: number[];
  fitness: number;
  details: Record<string, any>;
}

export const triggerPlan = (params: any = {}) =>
  api.post<{ task_id: string }>('/api/v1/plan/generate', params).then(res => res.data);

export const getPlanStatus = (taskId: string) =>
  api.get<{ status: string; order?: number[]; fitness?: number; error?: string }>(
    `/api/v1/plan/status/${taskId}`
  ).then(res => res.data);