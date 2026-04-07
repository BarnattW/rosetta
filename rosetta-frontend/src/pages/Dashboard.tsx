import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { jobsApi } from '../api/jobs'
import type { Job } from '../api/jobs'
import { authApi } from '../api/auth'
import { useAuthStore } from '../store/authStore'

const statusColors: Record<string, string> = {
  PENDING: 'bg-gray-100 text-gray-600',
  TRANSCRIBING: 'bg-blue-100 text-blue-600',
  TRANSLATING: 'bg-yellow-100 text-yellow-600',
  CAPTIONING: 'bg-purple-100 text-purple-600',
  COMPLETED: 'bg-green-100 text-green-600',
  FAILED: 'bg-red-100 text-red-600',
}

export default function Dashboard() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const { clearAuth, email } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    jobsApi.list().then(setJobs).finally(() => setLoading(false))
  }, [])

  async function handleLogout() {
    clearAuth()
    navigate('/')
    authApi.logout().catch(() => {})
  }

  async function handleDelete(jobId: string) {
    await jobsApi.delete(jobId)
    setJobs(jobs => jobs.filter(j => j.id !== jobId))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold">Rosetta</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{email}</span>
          <button
            onClick={() => navigate('/upload')}
            className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            New Job
          </button>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <h2 className="text-xl font-semibold mb-6">Your Jobs</h2>

        {loading ? (
          <p className="text-gray-500 text-sm">Loading...</p>
        ) : jobs.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg mb-2">No jobs yet</p>
            <p className="text-sm">Upload a video to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map(job => (
              <div key={job.id} className="bg-white rounded-xl border px-5 py-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[job.status]}`}>
                      {job.status}
                    </span>
                    <span className="text-sm text-gray-500">
                      {job.sourceLanguage} → {job.targetLanguage}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">{new Date(job.createdAt).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  {job.status === 'PENDING' && (
                    <button
                      onClick={() => navigate(`/jobs/${job.id}/status`)}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Upload
                    </button>
                  )}
                  {job.status === 'COMPLETED' && (
                    <button
                      onClick={() => navigate(`/jobs/${job.id}/captions`)}
                      className="text-sm text-green-600 hover:text-green-800"
                    >
                      Edit Captions
                    </button>
                  )}
                  {(job.status === 'TRANSCRIBING' || job.status === 'TRANSLATING' || job.status === 'CAPTIONING') && (
                    <button
                      onClick={() => navigate(`/jobs/${job.id}/status`)}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      View Progress
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(job.id)}
                    className="text-sm text-red-400 hover:text-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
