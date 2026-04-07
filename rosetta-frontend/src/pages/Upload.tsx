import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { jobsApi } from '../api/jobs'

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'ja', label: 'Japanese' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'zh', label: 'Chinese' },
  { code: 'ko', label: 'Korean' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'it', label: 'Italian' },
  { code: 'ru', label: 'Russian' },
]

export default function Upload() {
  const [file, setFile] = useState<File | null>(null)
  const [sourceLanguage, setSourceLanguage] = useState('ja')
  const [targetLanguage, setTargetLanguage] = useState('en')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return
    setError(null)
    setLoading(true)

    try {
      const { jobId, uploadUrl } = await jobsApi.create(sourceLanguage, targetLanguage, file.name)

      await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type || 'video/mp4' },
      })

      await jobsApi.start(jobId)
      navigate(`/jobs/${jobId}/status`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate('/dashboard')} className="text-sm text-gray-500 hover:text-gray-800">
          ← Back
        </button>
        <h1 className="text-lg font-semibold">New Job</h1>
      </header>

      <main className="max-w-lg mx-auto px-6 py-12">
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border p-8 space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Video File</label>
            <input
              type="file"
              accept="video/*"
              onChange={e => setFile(e.target.files?.[0] ?? null)}
              required
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-black file:text-white hover:file:bg-gray-800"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Source Language</label>
              <select
                value={sourceLanguage}
                onChange={e => setSourceLanguage(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-black"
              >
                {LANGUAGES.map(l => (
                  <option key={l.code} value={l.code}>{l.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Target Language</label>
              <select
                value={targetLanguage}
                onChange={e => setTargetLanguage(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-black"
              >
                {LANGUAGES.map(l => (
                  <option key={l.code} value={l.code}>{l.label}</option>
                ))}
              </select>
            </div>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading || !file}
            className="w-full bg-black text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Uploading...' : 'Upload & Translate'}
          </button>
        </form>
      </main>
    </div>
  )
}
