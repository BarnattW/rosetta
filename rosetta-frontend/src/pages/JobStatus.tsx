import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useAuthStore } from "../store/authStore"
import { useJob } from "../hooks/useJobs"

const STEPS = [
  { key: "TRANSCRIBING", label: "Transcribing audio", description: "Converting speech to text with Whisper" },
  { key: "TRANSLATING",  label: "Translating",        description: "Translating captions with GPT-4o" },
  { key: "CAPTIONING",   label: "Saving captions",    description: "Storing synchronized captions" },
]

function stepIndex(status: string) {
  return STEPS.findIndex(s => s.key === status)
}

export default function JobStatus() {
  const { jobId } = useParams<{ jobId: string }>()
  const { token } = useAuthStore()
  const [wsStatus, setWsStatus] = useState<string | null>(null)
  const navigate = useNavigate()

  const { data: job } = useJob(jobId!)

  const status = wsStatus ?? job?.status ?? "TRANSCRIBING"
  const failed = status === "FAILED"
  const completed = status === "COMPLETED"

  useEffect(() => {
    if (completed) {
      setTimeout(() => navigate(`/jobs/${jobId}/captions`), 1200)
    }
  }, [completed, jobId, navigate])

  useEffect(() => {
    if (!jobId || !token) return
    const ws = new WebSocket(`ws://localhost:5173/ws/jobs/${jobId}?token=${token}`)
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      setWsStatus(data.status)
    }
    return () => ws.close()
  }, [jobId, token])

  return (
    <div className="flex items-center justify-center h-full">
      <div className="w-full max-w-sm">
        {failed ? (
          <div className="bg-white rounded-2xl border border-zinc-200 p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-base font-semibold text-zinc-900 mb-1">Processing failed</h2>
            {job?.title && <p className="text-xs text-zinc-400 mb-3">{job.title}</p>}
            <p className="text-sm text-zinc-500 mb-6">{job?.errorMessage ?? 'An unexpected error occurred.'}</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full bg-zinc-900 hover:bg-zinc-700 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-zinc-200 p-8">
            {job?.title && (
              <p className="text-xs text-zinc-400 mb-1 truncate">{job.title}</p>
            )}
            <h2 className="text-base font-semibold text-zinc-900 mb-1">Processing your video</h2>
            <p className="text-sm text-zinc-400 mb-8">This usually takes 1–2 minutes.</p>

            <div className="space-y-0">
              {STEPS.map((step, i) => {
                const current = stepIndex(status)
                const done = completed || current > i
                const active = !completed && current === i

                return (
                  <div key={step.key} className="flex gap-4">
                    {/* Icon + connector */}
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 transition-colors
                        ${done ? 'bg-indigo-500 text-white' : active ? 'bg-indigo-500 text-white' : 'bg-zinc-100 text-zinc-400'}`}>
                        {done ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : i + 1}
                      </div>
                      {i < STEPS.length - 1 && (
                        <div className={`w-0.5 flex-1 my-1 min-h-5 transition-colors ${done ? 'bg-indigo-200' : 'bg-zinc-100'}`} />
                      )}
                    </div>

                    {/* Text */}
                    <div className={`pb-6 flex-1 ${i === STEPS.length - 1 ? 'pb-0' : ''}`}>
                      <div className="flex items-center gap-2 h-8">
                        <p className={`text-sm font-medium transition-colors
                          ${active ? 'text-zinc-900' : done ? 'text-zinc-400' : 'text-zinc-300'}`}>
                          {step.label}
                        </p>
                        {active && (
                          <div className="flex gap-0.5">
                            {[0, 1, 2].map(j => (
                              <div key={j} className="w-1 h-1 rounded-full bg-indigo-400 animate-bounce"
                                style={{ animationDelay: `${j * 0.15}s` }} />
                            ))}
                          </div>
                        )}
                      </div>
                      {(active || done) && (
                        <p className="text-xs text-zinc-400 -mt-1">{step.description}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {completed && (
              <p className="text-indigo-500 text-sm font-medium text-center mt-4 flex items-center justify-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                Done! Redirecting...
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
