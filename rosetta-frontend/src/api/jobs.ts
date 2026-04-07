import { api } from './client'

export type JobStatus =
  | 'PENDING'
  | 'TRANSCRIBING'
  | 'TRANSLATING'
  | 'CAPTIONING'
  | 'COMPLETED'
  | 'FAILED'

export interface Job {
  id: string
  status: JobStatus
  sourceLanguage: string
  targetLanguage: string
  createdAt: string
  completedAt: string | null
  errorMessage: string | null
}

export interface CreateJobResponse {
  jobId: string
  uploadUrl: string
}

export const jobsApi = {
  list: () => api.get<Job[]>('/api/jobs'),

  get: (jobId: string) => api.get<Job>(`/api/jobs/${jobId}`),

  create: (sourceLanguage: string, targetLanguage: string, fileName: string) =>
    api.post<CreateJobResponse>('/api/jobs', { sourceLanguage, targetLanguage, fileName }),

  start: (jobId: string) => api.post(`/api/jobs/${jobId}/start`),

  delete: (jobId: string) => api.delete(`/api/jobs/${jobId}`),
}
