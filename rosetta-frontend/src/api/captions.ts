import { api } from './client'

export interface Caption {
  id: string
  index: number
  startTime: number
  endTime: number
  originalText: string
  translatedText: string
  editedText: string | null
}

export const captionsApi = {
  list: (jobId: string) => api.get<Caption[]>(`/api/jobs/${jobId}/captions`),

  update: (jobId: string, captionId: string, editedText: string) =>
    api.patch<Caption>(`/api/jobs/${jobId}/captions/${captionId}`, { editedText }),

  exportSrt: (jobId: string) =>
    api.get<string>(`/api/jobs/${jobId}/captions/export/srt`),
}
