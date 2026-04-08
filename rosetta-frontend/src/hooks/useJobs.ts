import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { jobsApi } from '../api/jobs'

const TERMINAL = new Set(['COMPLETED', 'FAILED', 'PENDING'])

export function useJobs() {
  return useQuery({
    queryKey: ['jobs'],
    queryFn: () => jobsApi.list(),
    // Poll every 4s while any job is actively processing, then stop
    refetchInterval: query => {
      const jobs = query.state.data
      if (!jobs) return false
      return jobs.some(j => !TERMINAL.has(j.status)) ? 4000 : false
    },
  })
}

export function useJob(jobId: string) {
  return useQuery({
    queryKey: ['jobs', jobId],
    queryFn: () => jobsApi.get(jobId),
  })
}

export function useCreateJob() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ sourceLanguage, targetLanguages, fileName }: {
      sourceLanguage: string
      targetLanguages: string[]
      fileName: string
    }) => jobsApi.create(sourceLanguage, targetLanguages, fileName),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['jobs'] }),
  })
}

export function useStartJob() {
  return useMutation({
    mutationFn: (jobId: string) => jobsApi.start(jobId),
  })
}

export function useDeleteJob() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (jobId: string) => jobsApi.delete(jobId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['jobs'] }),
  })
}

export function useVideoUrl(jobId: string) {
  return useQuery({
    queryKey: ['video-url', jobId],
    queryFn: () => jobsApi.getVideoUrl(jobId),
    staleTime: 45 * 60 * 1000,
  })
}
