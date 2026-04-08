import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCreateJob, useStartJob } from '../hooks/useJobs'
import { useToast } from '../components/Toast'

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

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function Upload() {
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [sourceLanguage, setSourceLanguage] = useState('ja')
  const [targetLanguages, setTargetLanguages] = useState<string[]>(['en'])
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const { toast } = useToast()
  const { mutateAsync: createJob, isPending: creating } = useCreateJob()
  const { mutateAsync: startJob } = useStartJob()

  function toggleTarget(code: string) {
    setTargetLanguages(prev =>
      prev.includes(code) ? prev.filter(l => l !== code) : [...prev, code]
    )
  }

  function handleFile(f: File | undefined) {
    if (!f) return
    if (!f.type.startsWith('video/')) {
      setError('Please select a video file.')
      return
    }
    setError(null)
    setFile(f)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file || targetLanguages.length === 0) return
    setError(null)

    try {
      const { jobId, uploadUrl } = await createJob({ sourceLanguage, targetLanguages, fileName: file.name })
      await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type || 'video/mp4' },
      })
      await startJob(jobId)
      navigate(`/jobs/${jobId}/status`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong'
      setError(msg)
      toast(msg, 'error')
    }
  }

  const sameLanguageWarning = targetLanguages.includes(sourceLanguage)

  return (
    <div className="px-8 py-8 max-w-lg">
      <h2 className="text-lg font-semibold text-zinc-900 mb-6">New Video</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Drop zone */}
        <div
          className={`relative border-2 border-dashed rounded-xl transition-colors cursor-pointer
            ${dragging ? 'border-indigo-400 bg-indigo-50' : file ? 'border-zinc-300 bg-zinc-50' : 'border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50'}`}
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={e => handleFile(e.target.files?.[0])}
          />

          {file ? (
            <div className="flex items-center gap-3 px-5 py-4">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                    d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-900 truncate">{file.name}</p>
                <p className="text-xs text-zinc-400">{formatBytes(file.size)}</p>
              </div>
              <button
                type="button"
                onClick={e => { e.stopPropagation(); setFile(null) }}
                className="text-zinc-400 hover:text-zinc-700 transition-colors shrink-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 px-5 text-center">
              <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <p className="text-sm font-medium text-zinc-700">Drop your video here</p>
              <p className="text-xs text-zinc-400 mt-1">or click to browse</p>
            </div>
          )}
        </div>

        {/* Source language */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-2">Source language</label>
          <select
            value={sourceLanguage}
            onChange={e => setSourceLanguage(e.target.value)}
            className="w-full px-3 py-2.5 border border-zinc-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
          >
            {LANGUAGES.map(l => (
              <option key={l.code} value={l.code}>{l.label}</option>
            ))}
          </select>
        </div>

        {/* Target languages */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-2">
            Translate to
            <span className="ml-1.5 text-xs text-zinc-400 font-normal">select one or more</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {LANGUAGES.filter(l => l.code !== sourceLanguage).map(l => {
              const selected = targetLanguages.includes(l.code)
              return (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => toggleTarget(l.code)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-sm transition-colors text-left
                    ${selected
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50'
                    }`}
                >
                  <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-colors
                    ${selected ? 'bg-indigo-500 border-indigo-500' : 'border-zinc-300'}`}>
                    {selected && (
                      <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  {l.label}
                </button>
              )
            })}
          </div>
          {targetLanguages.length === 0 && (
            <p className="text-xs text-red-500 mt-1.5">Select at least one target language.</p>
          )}
        </div>

        {error && (
          <p className="text-sm text-red-500 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={creating || !file || targetLanguages.length === 0}
          className="w-full bg-indigo-500 hover:bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
        >
          {creating ? 'Uploading...' : `Upload & Translate to ${targetLanguages.length} language${targetLanguages.length !== 1 ? 's' : ''}`}
        </button>
      </form>
    </div>
  )
}
