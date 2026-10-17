import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import { Check, Play, Pause, RotateCcw, AlertTriangle, Download, Upload, ShieldCheck, CheckCircle2, Clock, HelpCircle, FileText } from 'lucide-react'
import { EXAMS, getExam, hasImage } from '../lib/data'
import { db, getKey, setKey } from '../lib/db'
import { parseAnswerFile, validateExam } from '../lib/schema'
import { pad, useToast } from '../components/ui'
import type { Answers, AudioSegment, AudioSegmentStatus } from '../types'
import AudioPlayer, { useExamAudio } from '../components/AudioPlayer'
import { getOfficialAnswers, getQuestionSolution } from '../lib/solutions'
import { getExamSegments, saveExamSegments, getAllSegmentStats, exportAllSegmentsJson, importSegmentsJson } from '../lib/audioSegments'

type Tab = 'questions' | 'answers' | 'audio'

export default function Admin() {
  const [examId, setExamId] = useState(1)
  const [tab, setTab] = useState<Tab>('questions')
  const exam = getExam(examId)
  const toast = useToast()

  const [key, setK] = useState<Answers>({})
  const [hasAudio, setHasAudio] = useState<Set<number>>(new Set())
  const fileA = useRef<HTMLInputElement>(null)
  const fileM = useRef<HTMLInputElement>(null)
  const fileSegJson = useRef<HTMLInputElement>(null)

  const audio = useExamAudio(examId)

  // Segment manager states
  const [segments, setSegments] = useState<Record<number, AudioSegment>>({})
  const [selectedQ, setSelectedQ] = useState(1)
  const [audioDuration, setAudioDuration] = useState(0)
  const [stats, setStats] = useState({ confirmed: 0, needsReview: 0, missing: 0, total: 120 })

  // Audio preview element for segment fine-tuning in Admin
  const adminAudioRef = useRef<HTMLAudioElement>(null)
  const [adminPlaying, setAdminPlaying] = useState(false)
  const [adminCurrentTime, setAdminCurrentTime] = useState(0)
  const adminSegTimerRef = useRef<number | null>(null)

  const refresh = async () => {
    const dbKey = await getKey(examId)
    setK(dbKey ?? getOfficialAnswers(examId) ?? {})
    const dbAudios = (await db.audio.toArray()).map(a => a.examId)
    setHasAudio(new Set([...dbAudios, 1, 2, 3, 4, 5, 6]))

    const segs = await getExamSegments(examId)
    setSegments(segs)

    const st = await getAllSegmentStats()
    setStats(st)
  }

  useEffect(() => {
    refresh()
  }, [examId])

  const issues = validateExam(exam)
  const flags = (n: number) => {
    const q = exam.questions[n - 1]
    const f: string[] = []
    if ((q.imageIds.length === 0 && !/pick|bank|dialog|fill|match_answer/.test(q.questionType)) || [...q.imageIds, ...q.choices.map(c => c.imageId ?? '')].some(id => id && !hasImage(id))) f.push('thiếu hình')
    if (q.section === 'reading' && !q.pinyin) f.push('thiếu Pinyin')
    if (!key[n]) f.push('thiếu đáp án')
    if (q.section === 'listening' && !hasAudio.has(examId)) f.push('thiếu audio')
    return f
  }

  const importAnswers = async (f: File) => {
    try {
      const { keys, issues } = parseAnswerFile(JSON.parse(await f.text()), EXAMS)
      for (const [id, a] of Object.entries(keys)) {
        const old = (await getKey(Number(id))) ?? {}
        await setKey(Number(id), { ...old, ...a }, 'import')
      }
      toast(issues.length ? `Nhập xong, ${issues.length} lỗi: ${issues.slice(0, 3).map(i => i.message).join('; ')}` : 'Đã nhập đáp án', issues.length ? 'error' : 'ok')
      refresh()
    } catch (e: any) {
      toast(`File không hợp lệ: ${e.message}`, 'error')
    }
  }

  const setAns = async (n: number, v: string) => {
    const next = { ...key }
    if (v) next[n] = v
    else delete next[n]
    setK(next)
    await setKey(examId, next, 'manual')
  }

  const uploadMp3 = async (f: File) => {
    if (!/\.mp3$/i.test(f.name) && f.type !== 'audio/mpeg') return toast('Chỉ nhận file .mp3', 'error')
    await db.audio.put({ examId, name: f.name, blob: f })
    toast(`Đã lưu ${f.name} cho Đề ${pad(examId)}`, 'ok')
    audio.reload()
    refresh()
  }

  // Current segment being edited
  const curSeg = segments[selectedQ] ?? {
    examId,
    questionNumber: selectedQ,
    start: 0,
    end: 5,
    status: 'missing',
    confirmed: false
  }

  const updateSeg = async (patch: Partial<AudioSegment>) => {
    const updated: AudioSegment = {
      ...curSeg,
      ...patch,
      examId,
      questionNumber: selectedQ,
      confirmed: patch.status ? patch.status === 'confirmed' : (patch.confirmed ?? curSeg.confirmed),
      status: patch.status ?? (patch.confirmed ? 'confirmed' : curSeg.status)
    }

    if (updated.end <= updated.start) {
      toast('Điểm kết thúc (End) phải lớn hơn điểm bắt đầu (Start)', 'error')
      return
    }

    const nextSegs = { ...segments, [selectedQ]: updated }
    setSegments(nextSegs)
    await saveExamSegments(examId, nextSegs)
    const st = await getAllSegmentStats()
    setStats(st)
    toast(`Đã lưu timestamp câu ${selectedQ}`, 'ok')
  }

  // Play segment in Admin preview
  const playAdminSegment = useCallback(() => {
    const a = adminAudioRef.current
    if (!a) return

    if (adminSegTimerRef.current) {
      window.clearTimeout(adminSegTimerRef.current)
      adminSegTimerRef.current = null
    }

    a.currentTime = curSeg.start
    a.play().then(() => {
      setAdminPlaying(true)
      const durationMs = Math.max(100, (curSeg.end - curSeg.start) * 1000)
      adminSegTimerRef.current = window.setTimeout(() => {
        a.pause()
        setAdminPlaying(false)
        a.currentTime = curSeg.start
      }, durationMs)
    }).catch(err => {
      toast(`Lỗi phát audio: ${err.message}`, 'error')
    })
  }, [curSeg, toast])

  const stopAdminSegment = useCallback(() => {
    const a = adminAudioRef.current
    if (!a) return
    if (adminSegTimerRef.current) {
      window.clearTimeout(adminSegTimerRef.current)
      adminSegTimerRef.current = null
    }
    a.pause()
    setAdminPlaying(false)
  }, [])

  // Export & Import All Segments
  const exportSegments = async () => {
    const all = await exportAllSegmentsJson()
    const blob = new Blob([JSON.stringify(all, null, 2)], { type: 'application/json' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `hsk1-audio-segments-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    toast('Đã xuất toàn bộ timestamp JSON', 'ok')
  }

  const importSegments = async (file: File) => {
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      const count = await importSegmentsJson(data)
      toast(`Đã nhập thành công ${count} timestamp câu nghe`, 'ok')
      refresh()
    } catch (e: any) {
      toast(`Lỗi nhập timestamp: ${e.message}`, 'error')
    }
  }

  // Warning checks for current segment
  const prevSeg = selectedQ > 1 ? segments[selectedQ - 1] : undefined
  const nextSeg = selectedQ < 20 ? segments[selectedQ + 1] : undefined
  const hasOverlapPrev = prevSeg && prevSeg.end > curSeg.start
  const hasOverlapNext = nextSeg && curSeg.end > nextSeg.start

  const sol = getQuestionSolution(examId, selectedQ)

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold mb-1">Quản trị nội dung (local)</h1>
        <p className="text-sm opacity-70">
          Dữ liệu gốc từ Word (chỉ đọc) tách biệt với nội dung giáo viên bổ sung (đáp án, MP3, timestamp, nghĩa Việt) lưu trong IndexedDB.
        </p>
      </div>

      {/* Exam selection buttons */}
      <div className="flex flex-wrap gap-2">
        {EXAMS.map(e => (
          <button
            key={e.examId}
            className={e.examId === examId ? 'btn-primary' : 'btn-ghost'}
            onClick={() => setExamId(e.examId)}
          >
            Đề {pad(e.examId)}
          </button>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(['questions', 'answers', 'audio'] as Tab[]).map(t => (
          <button
            key={t}
            className={tab === t ? 'btn-primary' : 'btn-ghost'}
            onClick={() => setTab(t)}
          >
            {{ questions: 'Câu hỏi', answers: 'Đáp án', audio: 'Audio & Timestamp' }[t]}
          </button>
        ))}
      </div>

      {issues.length > 0 && (
        <div className="card p-3 text-sm text-rose-700">Schema: {issues.map(i => i.message).join('; ')}</div>
      )}

      {/* TAB QUESTIONS */}
      {tab === 'questions' && (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left opacity-60">
                <th className="p-2">#</th>
                <th>Loại</th>
                <th>Nội dung gốc (Word)</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {exam.questions.map(q => (
                <tr key={q.questionNumber} className="border-t border-ink/5 align-top">
                  <td className="p-2 font-medium">{q.questionNumber}</td>
                  <td className="text-xs">{q.questionType}</td>
                  <td>
                    <span className="hanzi">{q.hanzi || (q.choices[0]?.hanzi ? q.choices.map(c => c.hanzi).join(' / ') : '(hình)')}</span>{' '}
                    <span className="pinyin text-xs">{q.pinyin}</span>
                  </td>
                  <td>
                    {flags(q.questionNumber).map(f => (
                      <span key={f} className="inline-block mr-1 mb-1 rounded-md bg-amber-50 text-amber-700 px-1.5 text-xs">
                        {f}
                      </span>
                    ))}
                    {flags(q.questionNumber).length === 0 && <span className="text-emerald-600 text-xs">đủ</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB ANSWERS */}
      {tab === 'answers' && (
        <div className="space-y-3">
          <div className="card p-4 text-sm flex flex-wrap gap-2 items-center">
            <button className="btn-ghost" onClick={() => fileA.current?.click()}>Nhập file đáp án (JSON)</button>
            <button
              className="btn-ghost"
              onClick={async () => {
                const all = await db.keys.toArray()
                const b = new Blob([JSON.stringify({ exams: Object.fromEntries(all.map(k => [k.examId, k.answers])) }, null, 1)])
                const a = document.createElement('a')
                a.href = URL.createObjectURL(b)
                a.download = 'answer-key.json'
                a.click()
              }}
            >
              Xuất đáp án
            </button>
            <span className="opacity-70">Định dạng: {'{"exams":{"1":{"1":"T","6":"B"}}}'} · T/F cho đúng/sai</span>
            <input ref={fileA} type="file" accept="application/json" hidden onChange={e => e.target.files?.[0] && importAnswers(e.target.files[0])} />
          </div>

          <div className="card p-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
            {exam.questions.map(q => (
              <label key={q.questionNumber} className="text-sm flex items-center gap-2">
                <span className="w-7 text-right font-medium">{q.questionNumber}</span>
                <select
                  className="flex-1 rounded-lg border px-1 py-1"
                  value={key[q.questionNumber] ?? ''}
                  onChange={e => setAns(q.questionNumber, e.target.value)}
                >
                  <option value="">—</option>
                  {q.choices.map(c => (
                    <option key={c.label} value={c.label}>
                      {c.label === 'T' ? 'Đúng' : c.label === 'F' ? 'Sai' : c.label}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
          <p className="text-xs opacity-70">
            Dữ liệu đáp án đã được tích hợp đầy đủ từ file Word (240 câu). Có thể chỉnh sửa thủ công hoặc import bản mới.
          </p>
        </div>
      )}

      {/* TAB AUDIO & TIMESTAMP */}
      {tab === 'audio' && (
        <div className="space-y-5">
          {/* Audio file upload & info banner */}
          <div className="card p-4 text-sm flex flex-wrap gap-3 items-center justify-between">
            <div>
              <span>Đề {pad(examId)} → <code>file nghe {examId}.mp3</code>: </span>
              {audio.url ? (
                <b className="text-emerald-600">Đã sẵn sàng ({audio.name || `file nghe ${examId}.mp3`})</b>
              ) : (
                <b className="text-amber-700">Chưa có audio</b>
              )}
            </div>
            <div className="flex gap-2">
              <button className="btn-ghost" onClick={() => fileM.current?.click()}>
                <Upload className="h-4 w-4" /> Tải MP3 tùy chỉnh
              </button>
              <input ref={fileM} type="file" accept="audio/mpeg,.mp3" hidden onChange={e => e.target.files?.[0] && uploadMp3(e.target.files[0])} />
            </div>
          </div>

          {/* Segment Statistics Overview (120 questions across 6 exams) */}
          <div className="card p-5 bg-gradient-to-r from-jade-50 to-cream border border-jade-200">
            <h2 className="font-bold text-base text-jade-900 mb-3 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-jade-700" /> Tổng quan trạng thái Timestamp (6 Đề × 20 Câu = 120 Câu)
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 bg-white rounded-xl border border-emerald-200 shadow-sm">
                <span className="text-xs opacity-60 block font-semibold uppercase">Đã xác nhận (Confirmed)</span>
                <span className="text-2xl font-extrabold text-emerald-600">{stats.confirmed}</span>
                <span className="text-xs text-ink/50 ml-1">/ 120</span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-amber-200 shadow-sm">
                <span className="text-xs opacity-60 block font-semibold uppercase">Cần kiểm tra (Needs Review)</span>
                <span className="text-2xl font-extrabold text-amber-600">{stats.needsReview}</span>
                <span className="text-xs text-ink/50 ml-1">/ 120</span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-ink/10 shadow-sm">
                <span className="text-xs opacity-60 block font-semibold uppercase">Chưa có (Missing)</span>
                <span className="text-2xl font-extrabold text-ink/60">{stats.missing}</span>
                <span className="text-xs text-ink/50 ml-1">/ 120</span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-jade-200 shadow-sm flex flex-col justify-center gap-1.5">
                <button type="button" className="btn-ghost !py-1 text-xs flex items-center justify-center gap-1" onClick={exportSegments}>
                  <Download className="h-3.5 w-3.5" /> Xuất JSON
                </button>
                <button type="button" className="btn-ghost !py-1 text-xs flex items-center justify-center gap-1" onClick={() => fileSegJson.current?.click()}>
                  <Upload className="h-3.5 w-3.5" /> Nhập JSON
                </button>
                <input ref={fileSegJson} type="file" accept="application/json" hidden onChange={e => e.target.files?.[0] && importSegments(e.target.files[0])} />
              </div>
            </div>
          </div>

          {/* Interactive Sentence Segment Editor */}
          {audio.url && (
            <div className="card p-5 sm:p-6 space-y-5 border-2 border-jade-500/20">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink/10 pb-3">
                <h2 className="font-bold text-lg text-ink">
                  Hiệu chỉnh Timestamp Câu nghe (Đề {pad(examId)})
                </h2>
                <span className="text-xs opacity-60 font-mono">
                  Thời lượng MP3: {audioDuration > 0 ? `${audioDuration.toFixed(1)}s` : 'Đang nạp…'}
                </span>
              </div>

              {/* Hidden audio element for editor */}
              <audio
                ref={adminAudioRef}
                src={audio.url}
                onLoadedMetadata={e => setAudioDuration(e.currentTarget.duration)}
                onTimeUpdate={e => setAdminCurrentTime(e.currentTarget.currentTime)}
              />

              {/* Question 1-20 selector pills */}
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-ink/60 block mb-2">
                  Chọn câu nghe để chỉnh:
                </span>
                <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
                  {Array.from({ length: 20 }, (_, i) => i + 1).map(qn => {
                    const s = segments[qn]
                    const isConf = s?.status === 'confirmed' || s?.confirmed
                    const isRev = s?.status === 'needsReview'
                    const isCur = selectedQ === qn
                    return (
                      <button
                        key={qn}
                        type="button"
                        onClick={() => {
                          stopAdminSegment()
                          setSelectedQ(qn)
                        }}
                        className={`h-9 rounded-xl text-xs font-semibold flex items-center justify-center border transition-all ${
                          isCur
                            ? 'ring-2 ring-jade-600 bg-jade-600 text-white border-jade-600'
                            : isConf
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                            : isRev
                            ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                            : 'bg-white text-ink/60 border-ink/15 hover:bg-ink/5'
                        }`}
                      >
                        Câu {qn}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Current Question Inspector & Controls */}
              <div className="p-4 rounded-2xl bg-jade-50/60 border border-jade-200 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base text-jade-900">
                      Đang chỉnh: Câu {pad(selectedQ)} / 20
                    </span>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                        curSeg.status === 'confirmed' || curSeg.confirmed
                          ? 'bg-emerald-100 text-emerald-800'
                          : curSeg.status === 'needsReview'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {curSeg.status === 'confirmed' || curSeg.confirmed
                        ? '✓ Đã xác nhận'
                        : curSeg.status === 'needsReview'
                        ? '⚠ Cần kiểm tra'
                        : 'Chưa có'}
                    </span>
                  </div>

                  {/* Audio Controls */}
                  <div className="flex items-center gap-2">
                    {adminPlaying ? (
                      <button type="button" className="btn-primary !py-1 !px-3 text-xs flex items-center gap-1 !bg-amber-600" onClick={stopAdminSegment}>
                        <Pause className="h-3.5 w-3.5" /> Dừng
                      </button>
                    ) : (
                      <button type="button" className="btn-primary !py-1 !px-3 text-xs flex items-center gap-1" onClick={playAdminSegment}>
                        <Play className="h-3.5 w-3.5" /> Nghe thử đoạn
                      </button>
                    )}
                    <button type="button" className="btn-ghost !py-1 !px-2.5 text-xs flex items-center gap-1" onClick={playAdminSegment}>
                      <RotateCcw className="h-3.5 w-3.5" /> Nghe lại
                    </button>
                  </div>
                </div>

                {/* Overlap / Bounds warnings */}
                {hasOverlapPrev && (
                  <div className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200 flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                    <span>Cảnh báo: Start ({curSeg.start}s) đang bị đè lên câu {selectedQ - 1} (kết thúc ở {prevSeg?.end}s).</span>
                  </div>
                )}
                {hasOverlapNext && (
                  <div className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200 flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                    <span>Cảnh báo: End ({curSeg.end}s) đang vượt quá điểm bắt đầu của câu {selectedQ + 1} ({nextSeg?.start}s).</span>
                  </div>
                )}

                {/* Start / End numeric and range inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white p-4 rounded-xl border border-ink/10">
                  <div>
                    <label className="text-xs font-semibold uppercase text-ink/60 block mb-1">
                      Start (Giây) — Bắt đầu câu:
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.05"
                        min={0}
                        max={audioDuration || 999}
                        className="w-32 rounded-lg border px-3 py-1.5 font-mono text-sm font-semibold"
                        value={curSeg.start}
                        onChange={e => updateSeg({ start: Number(e.target.value) })}
                      />
                      <input
                        type="range"
                        min={0}
                        max={audioDuration || 180}
                        step="0.1"
                        className="flex-1"
                        value={curSeg.start}
                        onChange={e => updateSeg({ start: Number(e.target.value) })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase text-ink/60 block mb-1">
                      End (Giây) — Kết thúc câu:
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.05"
                        min={0}
                        max={audioDuration || 999}
                        className="w-32 rounded-lg border px-3 py-1.5 font-mono text-sm font-semibold"
                        value={curSeg.end}
                        onChange={e => updateSeg({ end: Number(e.target.value) })}
                      />
                      <input
                        type="range"
                        min={0}
                        max={audioDuration || 180}
                        step="0.1"
                        className="flex-1"
                        value={curSeg.end}
                        onChange={e => updateSeg({ end: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                </div>

                {/* Duration indicator and Confirmation status buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <span className="text-xs text-ink/70">
                    Thời lượng đoạn nghe: <b className="text-jade-800 font-mono text-sm">{(curSeg.end - curSeg.start).toFixed(2)}s</b>
                  </span>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      className={`btn-ghost !py-1 !px-3 text-xs ${curSeg.status === 'needsReview' ? 'bg-amber-100 text-amber-800 border-amber-300 font-bold' : ''}`}
                      onClick={() => updateSeg({ status: 'needsReview', confirmed: false })}
                    >
                      Chưa xác nhận (Needs Review)
                    </button>
                    <button
                      type="button"
                      className="btn-primary !py-1 !px-3 text-xs flex items-center gap-1"
                      onClick={() => updateSeg({ status: 'confirmed', confirmed: true })}
                    >
                      <Check className="h-3.5 w-3.5" /> Xác nhận đoạn này
                    </button>
                  </div>
                </div>

                {/* Corresponding Transcript Reference for verification */}
                {sol && (
                  <div className="p-3 bg-white/90 rounded-xl border border-jade-200/80 space-y-1 text-left">
                    <div className="flex items-center gap-1 text-xs font-semibold text-jade-800 uppercase">
                      <FileText className="h-3.5 w-3.5" /> Lời thoại đối chiếu (Word):
                    </div>
                    <div className="hanzi text-lg font-medium text-ink">
                      {sol.hanzi}
                    </div>
                    <div className="pinyin text-xs text-jade-700">
                      {sol.pinyin}
                    </div>
                    {sol.explanation && (
                      <div className="text-xs text-ink/75 pt-1 border-t border-ink/5">
                        <b>Dịch:</b> {sol.explanation}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
