import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useJobs } from '../hooks/useJobs'
import { useToast } from '../components/Toast'
import VideoCard from '../components/VideoCard'
import type { Job } from '../api/jobs'

const STATUS_OPTIONS = ['All', 'COMPLETED', 'TRANSCRIBING', 'TRANSLATING', 'CAPTIONING', 'PENDING', 'FAILED']

type SortOption = 'newest' | 'oldest' | 'recently-worked'

function sortJobs(jobs: Job[], sort: SortOption): Job[] {
  return [...jobs].sort((a, b) => {
    if (sort === 'newest') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    }
    if (sort === 'oldest') {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    }
    if (sort === 'recently-worked') {
      const aTime = a.completedAt ? new Date(a.completedAt).getTime() : new Date(a.createdAt).getTime()
      const bTime = b.completedAt ? new Date(b.completedAt).getTime() : new Date(b.createdAt).getTime()
      return bTime - aTime
    }
    return 0
  })
}

function filterJobs(jobs: Job[], status: string, language: string, search: string): Job[] {
  return jobs.filter(job => {
    if (status !== 'All' && job.status !== status) return false
    if (language !== 'All' && !job.targetLanguages.includes(language)) return false
    if (search && !(job.title ?? 'Untitled').toLowerCase().includes(search.toLowerCase())) return false
    return true
  })
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { data: jobs, isLoading } = useJobs()
  const { toast } = useToast()
  const prevJobsRef = useRef<Job[]>([])

  // Fire a toast whenever a job transitions to COMPLETED or FAILED
  useEffect(() => {
    const prev = prevJobsRef.current
    if (prev.length > 0 && jobs) {
      for (const job of jobs) {
        const prevJob = prev.find(j => j.id === job.id)
        if (!prevJob || prevJob.status === job.status) continue
        if (job.status === 'COMPLETED') {
          toast(`"${job.title ?? 'Untitled'}" is ready`)
        } else if (job.status === 'FAILED') {
          toast(`"${job.title ?? 'Untitled'}" failed to process`, 'error')
        }
      }
    }
    prevJobsRef.current = jobs ?? []
  }, [jobs, toast])

  const [statusFilter, setStatusFilter] = useState('All')
  const [languageFilter, setLanguageFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortOption>('newest')

  const languages = jobs
    ? ['All', ...Array.from(new Set(jobs.flatMap(j => j.targetLanguages)))]
    : ['All']

  const processed = jobs
    ? sortJobs(filterJobs(jobs, statusFilter, languageFilter, search), sort)
    : []

  const hasActiveFilters = statusFilter !== 'All' || languageFilter !== 'All' || search

  return (
    <div className="px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-7">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">Your Videos</h2>
          {jobs && jobs.length > 0 && (
            <p className="text-sm text-zinc-400 mt-0.5">
              {processed.length} of {jobs.length} video{jobs.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        <button
          onClick={() => navigate('/upload')}
          className="flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-700 text-white px-3.5 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          New Video
        </button>
      </div>

      {/* Filters */}
      {jobs && jobs.length > 0 && (
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <div className="relative">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 border border-zinc-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent w-40 bg-white placeholder:text-zinc-400"
            />
          </div>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 border border-zinc-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent bg-white text-zinc-700"
          >
            {STATUS_OPTIONS.map(s => (
              <option key={s} value={s}>{s === 'All' ? 'All statuses' : s.charAt(0) + s.slice(1).toLowerCase()}</option>
            ))}
          </select>

          <select
            value={languageFilter}
            onChange={e => setLanguageFilter(e.target.value)}
            className="px-3 py-1.5 border border-zinc-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent bg-white text-zinc-700"
          >
            {languages.map(l => (
              <option key={l} value={l}>{l === 'All' ? 'All languages' : l.toUpperCase()}</option>
            ))}
          </select>

          <select
            value={sort}
            onChange={e => setSort(e.target.value as SortOption)}
            className="px-3 py-1.5 border border-zinc-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent bg-white text-zinc-700"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="recently-worked">Recently worked on</option>
          </select>

          {hasActiveFilters && (
            <button
              onClick={() => { setStatusFilter('All'); setLanguageFilter('All'); setSearch('') }}
              className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-700 transition-colors"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear
            </button>
          )}
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-zinc-100 overflow-hidden animate-pulse">
              <div className="aspect-video bg-zinc-100" />
              <div className="px-3 py-2.5 space-y-2">
                <div className="h-3.5 bg-zinc-100 rounded w-3/4" />
                <div className="h-3 bg-zinc-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) :!jobs || jobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-28 text-center">
          <div className="w-14 h-14 rounded-2xl bg-zinc-100 flex items-center justify-center mb-4">
            <svg className="w-7 h-7 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
            </svg>
          </div>
          <p className="text-zinc-800 font-medium mb-1">No videos yet</p>
          <p className="text-sm text-zinc-400 mb-6">Upload a video to get started</p>
          <button
            onClick={() => navigate('/upload')}
            className="bg-zinc-900 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-zinc-700 transition-colors"
          >
            Upload Video
          </button>
        </div>
      ) : processed.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center text-zinc-400">
          <svg className="w-8 h-8 mb-3 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p className="text-sm">No videos match your filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {processed.map(job => (
            <VideoCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </div>
  )
}
