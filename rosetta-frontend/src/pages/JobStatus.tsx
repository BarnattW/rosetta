import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { jobsApi } from '../api/jobs'
import { useAuthStore } from '../store/authStore'

const STEPS = ['TRANSCRIBING', 'TRANSLATING', 'CAPTIONING', 'COMPLETED']

function stepIndex(status: string) {
  return STEPS.indexOf(status)
}

export default function JobStatus() {
  const { jobId } = useParams<{ jobId: string }>()
  const { token } = useAuthStore()
  const [status, setStatus] = useState<string>('TRANSCRIBING')
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  function handleStatus(newStatus: string) {
    setStatus(newStatus)
    if (newStatus === 'COMPLETED') {
      setTimeout(() => navigate(`/jobs/${jobId}/captions`), 1000)
    }
    if (newStatus === 'FAILED') {
      setError('Job failed. Please try again.')
    }
  }

  // fetch current status first
  useEffect(() => {
    if (!jobId) return
    jobsApi.get(jobId).then(job => handleStatus(job.status))
  }, [jobId])

  // then layer websocket on top for live updates
  useEffect(() => {
    if (!jobId || !token) return

    const ws = new WebSocket(`ws://localhost:5173/ws/jobs/${jobId}?token=${token}`)
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      handleStatus(data.status)
    }

    return () => ws.close()
  }, [jobId, token])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-xl border p-10 w-full max-w-md text-center">
        <h2 className="text-xl font-semibold mb-8">Processing your video</h2>

        <div className="space-y-4 mb-8">
          {STEPS.slice(0, 3).map((step, i) => {
            const current = stepIndex(status)
            const done = current > i
            const active = current === i

            return (
              <div key={step} className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium shrink-0
                  ${done ? 'bg-green-500 text-white' : active ? 'bg-black text-white' : 'bg-gray-100 text-gray-400'}`}>
                  {done ? '✓' : i + 1}
                </div>
                <span className={`text-sm ${active ? 'font-medium' : 'text-gray-400'}`}>
                  {step.charAt(0) + step.slice(1).toLowerCase()}
                </span>
                {active && (
                  <span className="ml-auto text-xs text-gray-400 animate-pulse">In progress...</span>
                )}
              </div>
            )
          })}
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}
        {status === 'COMPLETED' && (
          <p className="text-green-600 text-sm font-medium">Done! Redirecting to captions...</p>
        )}
      </div>
    </div>
  )
}
