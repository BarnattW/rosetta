import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { captionsApi } from '../api/captions'
import type { Caption } from '../api/captions'

export default function CaptionEditor() {
  const { jobId } = useParams<{ jobId: string }>()
  const [captions, setCaptions] = useState<Caption[]>([])
  const [editing, setEditing] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    if (!jobId) return
    captionsApi.list(jobId).then(setCaptions).finally(() => setLoading(false))
  }, [jobId])

  function getText(caption: Caption) {
    return editing[caption.id] ?? caption.editedText ?? caption.translatedText
  }

  async function handleSave(caption: Caption) {
    if (!jobId) return
    const text = editing[caption.id]
    if (!text || text === (caption.editedText ?? caption.translatedText)) return
    setSaving(caption.id)
    try {
      const updated = await captionsApi.update(jobId, caption.id, text)
      setCaptions(cs => cs.map(c => c.id === caption.id ? updated : c))
      setEditing(e => { const next = { ...e }; delete next[caption.id]; return next })
    } finally {
      setSaving(null)
    }
  }

  async function handleExport() {
    if (!jobId) return
    const srt = await captionsApi.exportSrt(jobId)
    const blob = new Blob([srt], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'captions.srt'
    a.click()
    URL.revokeObjectURL(url)
  }

  function formatTime(ms: number) {
    const s = Math.floor(ms / 1000)
    const m = Math.floor(s / 60)
    const h = Math.floor(m / 60)
    return `${String(h).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="text-sm text-gray-500 hover:text-gray-800">
            ← Dashboard
          </button>
          <h1 className="text-lg font-semibold">Caption Editor</h1>
        </div>
        <button
          onClick={handleExport}
          className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          Export SRT
        </button>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        {loading ? (
          <p className="text-gray-500 text-sm">Loading captions...</p>
        ) : (
          <div className="space-y-3">
            {captions.map(caption => (
              <div key={caption.id} className="bg-white rounded-xl border p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-mono text-gray-400">
                    {formatTime(caption.startTime)} → {formatTime(caption.endTime)}
                  </span>
                  {caption.editedText && (
                    <span className="text-xs bg-yellow-100 text-yellow-600 px-2 py-0.5 rounded-full">edited</span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mb-2">{caption.originalText}</p>
                <textarea
                  value={getText(caption)}
                  onChange={e => setEditing(ed => ({ ...ed, [caption.id]: e.target.value }))}
                  onBlur={() => handleSave(caption)}
                  rows={2}
                  className="w-full text-sm border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-black resize-none"
                />
                {saving === caption.id && (
                  <p className="text-xs text-gray-400 mt-1">Saving...</p>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
