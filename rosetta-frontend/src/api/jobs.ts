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
  title: string | null
  status: JobStatus
  sourceLanguage: string
  targetLanguages: string[]
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

  create: (sourceLanguage: string, targetLanguages: string[], fileName: string) =>
    api.post<CreateJobResponse>('/api/jobs', { sourceLanguage, targetLanguages, fileName }),

  start: (jobId: string) => api.post(`/api/jobs/${jobId}/start`),

  delete: (jobId: string) => api.delete(`/api/jobs/${jobId}`),

  getVideoUrl: (jobId: string) => api.get<string>(`/api/jobs/${jobId}/video-url`),
}
