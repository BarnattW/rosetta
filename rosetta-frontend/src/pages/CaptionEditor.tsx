import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useCaptions, useUpdateCaption, useExportSrt } from '../hooks/useCaptions'
import { useVideoUrl, useJob } from '../hooks/useJobs'
import { useToast } from '../components/Toast'
import type { Caption } from '../api/captions'

type ExportFormat = 'SRT' | 'VTT' | 'ASS'

// ─── time formatters ────────────────────────────────────────────────────────

function pad(n: number, len = 2) { return String(n).padStart(len, '0') }

function fmtSrt(ms: number) {
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  return `${pad(h)}:${pad(m)}:${pad(s)},${pad(ms % 1000, 3)}`
}

function fmtVtt(ms: number) { return fmtSrt(ms).replace(',', '.') }

function fmtAss(ms: number) {
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  return `${h}:${pad(m)}:${pad(s)}.${pad(Math.floor((ms % 1000) / 10))}`
}

function fmtDisplay(ms: number) {
  const s = Math.floor(ms / 1000)
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`
}

function fmtDuration(ms: number) {
  const s = (ms / 1000).toFixed(1)
  return `${s}s`
}

// ─── export builders ─────────────────────────────────────────────────────────

function buildVtt(captions: Caption[], getText: (c: Caption) => string) {
  return ['WEBVTT', '', ...captions.flatMap((c, i) => [
    String(i + 1),
    `${fmtVtt(c.startTime)} --> ${fmtVtt(c.endTime)}`,
    getText(c),
    '',
  ])].join('\n')
}

function buildAss(captions: Caption[], getText: (c: Caption) => string) {
  const header = `[Script Info]
ScriptType: v4.00+
Collisions: Normal
PlayDepth: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,20,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,2,2,2,10,10,10,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text`
  const events = captions.map(c =>
    `Dialogue: 0,${fmtAss(c.startTime)},${fmtAss(c.endTime)},Default,,0,0,0,,${getText(c)}`
  ).join('\n')
  return header + '\n' + events
}

function downloadFile(content: string, filename: string) {
  const url = URL.createObjectURL(new Blob([content], { type: 'text/plain' }))
  Object.assign(document.createElement('a'), { href: url, download: filename }).click()
  URL.revokeObjectURL(url)
}

const CHAR_MAX = 300

// ─── component ───────────────────────────────────────────────────────────────

export default function CaptionEditor() {
  const { jobId } = useParams<{ jobId: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [editing, setEditing] = useState<Record<string, string>>({})
  const [selectedLanguage, setSelectedLanguage] = useState('')
  const [search, setSearch] = useState('')
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [scrubbing, setScrubbing] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [zoom, setZoom] = useState(1)

  const videoRef    = useRef<HTMLVideoElement>(null)
  const timelineRef = useRef<HTMLDivElement>(null)
  const listRef     = useRef<HTMLDivElement>(null)
  const activeRef   = useRef<HTMLDivElement>(null)

  const { data: job }      = useJob(jobId!)
  const { data: videoUrl } = useVideoUrl(jobId!)

  const languages      = useMemo(() => job?.targetLanguages ?? [], [job])
  const activeLanguage = selectedLanguage || languages[0] || ''

  const { data: captions, isLoading } = useCaptions(jobId!, activeLanguage)
  const { mutate: saveCaption, isPending: saving } = useUpdateCaption(jobId!, activeLanguage)
  const { refetch: fetchSrt } = useExportSrt(jobId!, activeLanguage)

  const visibleDuration = duration > 0 ? duration / zoom : 0
  const viewStart       = duration > 0 && zoom > 1
    ? Math.max(0, Math.min(currentTime - visibleDuration / 2, duration - visibleDuration))
    : 0
  const progressPct = visibleDuration > 0
    ? Math.max(0, Math.min(100, ((currentTime - viewStart) / visibleDuration) * 100))
    : 0

  const currentMs     = currentTime * 1000
  const activeCaption = captions?.find(c => currentMs >= c.startTime && currentMs < c.endTime)

  const filteredCaptions = captions?.filter(c => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return c.originalText.toLowerCase().includes(q) ||
           c.translatedText.toLowerCase().includes(q) ||
           (c.editedText ?? '').toLowerCase().includes(q)
  })

  const dirtyCount = Object.keys(editing).length

  // Auto-scroll caption list
  useEffect(() => {
    if (activeRef.current) activeRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [activeCaption?.id])

  // ─── keyboard shortcuts ─────────────────────────────────────────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'TEXTAREA' || tag === 'INPUT') return

      if (e.key === ' ') {
        e.preventDefault()
        if (!videoRef.current) return
        videoRef.current.paused ? videoRef.current.play() : videoRef.current.pause()
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        if (videoRef.current) videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 5)
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        if (videoRef.current) videoRef.current.currentTime = Math.min(duration, videoRef.current.currentTime + 5)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [duration])

  // ─── scrubbing ──────────────────────────────────────────────────────────────
  const seekToPosition = useCallback((clientX: number) => {
    if (!timelineRef.current || !videoRef.current || !duration) return
    const rect     = timelineRef.current.getBoundingClientRect()
    const ratio    = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    const seekTime = viewStart + ratio * visibleDuration
    videoRef.current.currentTime = seekTime
    setCurrentTime(seekTime)
  }, [duration, viewStart, visibleDuration])

  useEffect(() => {
    if (!scrubbing) return
    const onMove = (e: MouseEvent) => seekToPosition(e.clientX)
    const onUp   = () => setScrubbing(false)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  }, [scrubbing, seekToPosition])

  // ─── helpers ────────────────────────────────────────────────────────────────
  function getText(c: Caption) { return editing[c.id] ?? c.editedText ?? c.translatedText }

  function jumpTo(startTime: number) {
    if (!videoRef.current) return
    videoRef.current.currentTime = startTime / 1000
    videoRef.current.play()
  }

  function handleFocus() {
    videoRef.current?.pause()
  }

  function handleBlur(c: Caption) {
    const text = editing[c.id]
    if (text === undefined || text === (c.editedText ?? c.translatedText)) return
    saveCaption(
      { captionId: c.id, editedText: text },
      { onSuccess: () => toast('Caption saved') }
    )
    setEditing(prev => { const next = { ...prev }; delete next[c.id]; return next })
  }

  function handleTabKey(e: React.KeyboardEvent, c: Caption) {
    if (e.key !== 'Tab') return
    e.preventDefault()
    const idx  = captions?.findIndex(x => x.id === c.id) ?? -1
    const next = captions?.[idx + (e.shiftKey ? -1 : 1)]
    if (next) {
      document.querySelector<HTMLTextAreaElement>(`[data-caption="${next.id}"]`)?.focus()
    }
  }

  async function handleExport(format: ExportFormat) {
    setShowExportMenu(false)
    if (!captions) return
    if (format === 'SRT') {
      const { data: srt } = await fetchSrt()
      if (srt) downloadFile(srt, `captions-${activeLanguage}.srt`)
      return
    }
    const content = format === 'VTT' ? buildVtt(captions, getText) : buildAss(captions, getText)
    downloadFile(content, `captions-${activeLanguage}.${format.toLowerCase()}`)
  }

  // ─── render ─────────────────────────────────────────────────────────────────
  return (
    <div className="h-screen bg-zinc-950 text-white flex flex-col overflow-hidden">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="bg-zinc-900 border-b border-zinc-800 px-5 h-12 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Dashboard
          </button>
          {job?.title && (
            <>
              <span className="text-zinc-700">/</span>
              <p className="text-sm text-zinc-300 truncate">{job.title}</p>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {dirtyCount > 0 && (
            <span className="text-xs text-amber-400 px-2 py-1 bg-amber-400/10 rounded-md">
              {dirtyCount} unsaved
            </span>
          )}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(v => !v)}
              className="flex items-center gap-1.5 bg-white text-zinc-900 px-3.5 py-1.5 rounded-lg text-sm font-medium hover:bg-zinc-100 transition-colors"
            >
              Export
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showExportMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-zinc-100 overflow-hidden z-10 min-w-40">
                {(['SRT', 'VTT', 'ASS'] as ExportFormat[]).map(fmt => (
                  <button key={fmt} onClick={() => handleExport(fmt)}
                    className="w-full px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 text-left flex items-center justify-between gap-6">
                    <span className="font-medium">{fmt}</span>
                    <span className="text-xs text-zinc-400">
                      {fmt === 'SRT' ? 'SubRip' : fmt === 'VTT' ? 'WebVTT' : 'Adv. SSA'}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Main ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Video + controls */}
        <div className="flex-1 flex flex-col bg-black min-h-0">

          {/* Video */}
          <div className="flex-1 flex items-center justify-center relative min-h-0">
            {videoUrl ? (
              <video
                ref={videoRef}
                src={videoUrl}
                controls
                onTimeUpdate={() => videoRef.current && setCurrentTime(videoRef.current.currentTime)}
                onLoadedMetadata={() => videoRef.current && setDuration(videoRef.current.duration)}
                className="max-h-full max-w-full"
              />
            ) : (
              <p className="text-zinc-600 text-sm">Loading video...</p>
            )}
            {activeCaption && (
              <div className="absolute bottom-16 left-0 right-0 flex justify-center px-8 pointer-events-none">
                <div className="bg-black/80 text-white text-base px-4 py-2 rounded text-center max-w-2xl leading-snug">
                  {getText(activeCaption)}
                </div>
              </div>
            )}
          </div>

          {/* Language track selector — only when >1 language */}
          {languages.length > 1 && (
            <div className="shrink-0 bg-zinc-900 border-t border-zinc-800 px-4 py-2 flex items-center gap-3">
              <span className="text-xs text-zinc-500 flex items-center gap-1.5 shrink-0">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
                Track
              </span>
              <div className="flex items-center gap-1">
                {languages.map(lang => (
                  <button
                    key={lang}
                    onClick={() => { setSelectedLanguage(lang); setEditing({}) }}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors
                      ${activeLanguage === lang
                        ? 'bg-indigo-500 text-white'
                        : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                      }`}
                  >
                    {lang.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Timeline scrubber */}
          {duration > 0 && captions && (
            <div className="shrink-0 bg-zinc-900 border-t border-zinc-800 px-4 py-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono text-zinc-500">{fmtDisplay(currentTime * 1000)}</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setZoom(z => Math.max(1, z / 2))}
                    disabled={zoom === 1}
                    className="w-5 h-5 flex items-center justify-center rounded text-zinc-400 hover:text-white hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-default transition-colors text-sm leading-none"
                  >−</button>
                  <span className="text-xs font-mono text-zinc-500 w-7 text-center">{zoom}×</span>
                  <button
                    onClick={() => setZoom(z => Math.min(16, z * 2))}
                    disabled={zoom === 16}
                    className="w-5 h-5 flex items-center justify-center rounded text-zinc-400 hover:text-white hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-default transition-colors text-sm leading-none"
                  >+</button>
                </div>
                <span className="text-xs font-mono text-zinc-600">{fmtDisplay(duration * 1000)}</span>
              </div>
              <div
                ref={timelineRef}
                className="relative h-8 bg-zinc-800 rounded cursor-pointer select-none overflow-hidden"
                onMouseDown={e => { setScrubbing(true); seekToPosition(e.clientX) }}
              >
                {captions.map(c => {
                  const cStart = c.startTime / 1000
                  const cEnd   = c.endTime / 1000
                  if (cEnd < viewStart || cStart > viewStart + visibleDuration) return null
                  const left  = ((cStart - viewStart) / visibleDuration) * 100
                  const width = ((cEnd - cStart) / visibleDuration) * 100
                  return (
                    <div
                      key={c.id}
                      title={getText(c)}
                      className={`absolute top-1 h-6 rounded-sm transition-colors
                        ${activeCaption?.id === c.id ? 'bg-indigo-400' : 'bg-zinc-600 hover:bg-zinc-500'}`}
                      style={{ left: `${left}%`, width: `${Math.max(width, 0.3)}%` }}
                    />
                  )
                })}
                <div className="absolute top-0 bottom-0 w-0.5 bg-red-500 pointer-events-none"
                  style={{ left: `${progressPct}%` }}>
                  <div className="w-2.5 h-2.5 bg-red-500 rounded-full -translate-x-1 -translate-y-0.5" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Caption sidebar ─────────────────────────────────────────────── */}
        <div className="w-80 bg-zinc-900 border-l border-zinc-800 flex flex-col overflow-hidden">

          {/* Sidebar header */}
          <div className="px-4 py-2.5 border-b border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Captions</span>
                {captions && <span className="text-xs text-zinc-600">{captions.length}</span>}
              </div>
              {saving && <span className="text-xs text-zinc-500 animate-pulse">Saving...</span>}
            </div>
            {/* Search */}
            <div className="relative">
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-600 pointer-events-none"
                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search captions..."
                className="w-full pl-7 pr-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-white placeholder:text-zinc-600 outline-none focus:border-zinc-500"
              />
              {search && (
                <button onClick={() => setSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            {search && filteredCaptions && (
              <p className="text-xs text-zinc-600">{filteredCaptions.length} result{filteredCaptions.length !== 1 ? 's' : ''}</p>
            )}
          </div>

          {/* Caption list */}
          <div ref={listRef} className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="animate-pulse space-y-2">
                    <div className="h-3 bg-zinc-800 rounded w-1/3" />
                    <div className="h-14 bg-zinc-800 rounded" />
                  </div>
                ))}
              </div>
            ) : filteredCaptions?.length === 0 ? (
              <p className="text-xs text-zinc-600 p-4">No captions match "{search}"</p>
            ) : (
              filteredCaptions?.map(c => {
                const isActive = activeCaption?.id === c.id
                const text     = getText(c)
                const isDirty  = editing[c.id] !== undefined
                const overMax  = text.length > CHAR_MAX

                return (
                  <div
                    key={c.id}
                    ref={isActive ? activeRef : undefined}
                    className={`px-4 py-3 border-b border-zinc-800/60 transition-colors
                      ${isActive ? 'bg-zinc-800' : 'hover:bg-zinc-800/40'}`}
                    onClick={() => jumpTo(c.startTime)}
                  >
                    {/* Timestamp row */}
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs font-mono text-zinc-500">{fmtDisplay(c.startTime)}</span>
                      <span className="text-[10px] text-zinc-700">{fmtDuration(c.endTime - c.startTime)}</span>
                      {c.editedText && !isDirty && (
                        <span className="text-[10px] bg-indigo-900/60 text-indigo-400 px-1.5 py-0.5 rounded font-medium">
                          edited
                        </span>
                      )}
                      {isDirty && (
                        <span className="text-[10px] bg-amber-900/60 text-amber-400 px-1.5 py-0.5 rounded font-medium">
                          unsaved
                        </span>
                      )}
                    </div>

                    {/* Original */}
                    <p className="text-xs text-zinc-600 mb-1.5 line-clamp-1" title={c.originalText}>
                      {c.originalText}
                    </p>

                    {/* Translated textarea */}
                    <textarea
                      data-caption={c.id}
                      value={text}
                      onChange={e => setEditing(prev => ({ ...prev, [c.id]: e.target.value }))}
                      onFocus={handleFocus}
                      onBlur={() => handleBlur(c)}
                      onKeyDown={e => handleTabKey(e, c)}
                      onClick={e => e.stopPropagation()}
                      rows={2}
                      className={`w-full text-sm bg-zinc-800 rounded-lg px-2.5 py-1.5 outline-none resize-none text-white
                        placeholder:text-zinc-600 transition-colors border
                        ${overMax ? 'border-red-500' : isDirty ? 'border-amber-500/60' : 'border-zinc-700 focus:border-indigo-500'}`}
                    />
                  </div>
                )
              })
            )}
          </div>

          {/* Keyboard hints */}
          <div className="px-4 py-2.5 border-t border-zinc-800 flex items-center gap-3 flex-wrap">
            {[
              ['Space', 'play/pause'],
              ['← →', '±5s'],
              ['Tab', 'next'],
            ].map(([key, label]) => (
              <span key={key} className="flex items-center gap-1 text-[10px] text-zinc-600">
                <kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-zinc-400 font-mono text-[10px]">
                  {key}
                </kbd>
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {showExportMenu && (
        <div className="fixed inset-0 z-0" onClick={() => setShowExportMenu(false)} />
      )}
    </div>
  )
}
