import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Job } from '../api/jobs'
import { useVideoUrl, useDeleteJob } from '../hooks/useJobs'
import { useToast } from './Toast'
import ConfirmDialog from './ConfirmDialog'

const statusConfig: Record<string, { label: string; color: string }> = {
  PENDING:      { label: 'Pending',      color: 'bg-zinc-100 text-zinc-500' },
  TRANSCRIBING: { label: 'Transcribing', color: 'bg-blue-50 text-blue-600' },
  TRANSLATING:  { label: 'Translating',  color: 'bg-amber-50 text-amber-600' },
  CAPTIONING:   { label: 'Captioning',   color: 'bg-purple-50 text-purple-600' },
  COMPLETED:    { label: 'Done',         color: 'bg-emerald-50 text-emerald-600' },
  FAILED:       { label: 'Failed',       color: 'bg-red-50 text-red-500' },
}

export default function VideoCard({ job }: { job: Job }) {
  const navigate = useNavigate()
  const { data: videoUrl } = useVideoUrl(job.id)
  const { mutate: deleteJob } = useDeleteJob()
  const { toast } = useToast()
  const [confirming, setConfirming] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  const status = statusConfig[job.status] ?? { label: job.status, color: 'bg-zinc-100 text-zinc-500' }
  const isProcessing = !['COMPLETED', 'PENDING', 'FAILED'].includes(job.status)
  const canPreview = job.status === 'COMPLETED' && !!videoUrl

  function handleClick() {
    if (job.status === 'COMPLETED') {
      navigate(`/jobs/${job.id}/captions`)
    } else if (job.status === 'PENDING') {
      navigate(`/upload`)
    } else {
      navigate(`/jobs/${job.id}/status`)
    }
  }

  function handleDelete() {
    setConfirming(false)
    deleteJob(job.id, {
      onSuccess: () => toast(`"${job.title ?? 'Untitled'}" deleted`),
      onError: () => toast('Failed to delete video', 'error'),
    })
  }

  function handleMouseEnter() {
    if (!canPreview || !videoRef.current) return
    videoRef.current.play().catch(() => {})
  }

  function handleMouseLeave() {
    if (!videoRef.current) return
    videoRef.current.pause()
    videoRef.current.currentTime = 0
  }

  const languages = job.targetLanguages ?? []

  return (
    <div className="group relative bg-white rounded-xl border border-zinc-200 overflow-hidden hover:border-zinc-300 hover:shadow-md transition-all duration-150 cursor-pointer">
      {/* Thumbnail */}
      <div
        className="aspect-video bg-zinc-50 relative overflow-hidden"
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {videoUrl ? (
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full object-cover"
            muted
            preload="metadata"
            loop
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-10 h-10 text-zinc-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
            </svg>
          </div>
        )}

        {isProcessing && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce" />
            </div>
          </div>
        )}

        {job.status === 'FAILED' && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        )}

        <div className={`absolute top-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-medium ${status.color}`}>
          {status.label}
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); setConfirming(true) }}
          className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 w-6 h-6 rounded bg-black/60 hover:bg-black/80 flex items-center justify-center transition-opacity"
          title="Delete"
        >
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      {/* Info */}
      <div className="px-3 py-2.5" onClick={handleClick}>
        <p className="text-sm font-medium text-zinc-900 truncate leading-snug">
          {job.title ?? 'Untitled'}
        </p>
        <div className="flex items-center justify-between mt-0.5">
          <p className="text-xs text-zinc-400">
            {job.sourceLanguage.toUpperCase()} →{' '}
            {languages.length > 0 ? languages.map(l => l.toUpperCase()).join(', ') : '—'}
          </p>
          <p className="text-xs text-zinc-300">{new Date(job.createdAt).toLocaleDateString()}</p>
        </div>
      </div>

      {confirming && (
        <ConfirmDialog
          title="Delete video?"
          message={`"${job.title ?? 'Untitled'}" and all its captions will be permanently deleted.`}
          onConfirm={handleDelete}
          onCancel={() => setConfirming(false)}
        />
      )}
    </div>
  )
}
