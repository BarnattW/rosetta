import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { captionsApi } from '../api/captions'

export function useCaptions(jobId: string, language: string) {
  return useQuery({
    queryKey: ['captions', jobId, language],
    queryFn: () => captionsApi.list(jobId, language),
    enabled: !!language,
  })
}

export function useUpdateCaption(jobId: string, language: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ captionId, editedText }: { captionId: string; editedText: string }) =>
      captionsApi.update(jobId, captionId, editedText),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['captions', jobId, language] }),
  })
}

export function useExportSrt(jobId: string, language: string) {
  return useQuery({
    queryKey: ['srt', jobId, language],
    queryFn: () => captionsApi.exportSrt(jobId, language),
    enabled: false,
  })
}
