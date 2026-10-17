import { useEffect, useRef, useState, useCallback } from 'react'
import { Pause, Play, RotateCcw, Volume2, Upload, FileText, Languages, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { db, getSettings } from '../lib/db'
import { getExamSegments } from '../lib/audioSegments'
import { getQuestionSolution } from '../lib/solutions'
import type { AudioSegment } from '../types'

const SPEEDS = [0.75, 0.85, 1, 1.1]

export const DEFAULT_AUDIO_MAP: Record<number, string> = {
  1: '/audio/file%20nghe%201.mp3',
  2: '/audio/file%20nghe%202.mp3',
  3: '/audio/file%20nghe%203.mp3',
  4: '/audio/file%20nghe%204.mp3',
  5: '/audio/file%20nghe%205.mp3',
  6: '/audio/file%20nghe%206.mp3',
}

export function useExamAudio(examId: number) {
  const [url, setUrl] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [segments, setSegments] = useState<Record<number, AudioSegment>>({})
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let u: string | null = null
    let live = true
    ;(async () => {
      const rec = await db.audio.get(examId)
      const segs = await getExamSegments(examId)
      if (!live) return

      if (rec) {
        u = URL.createObjectURL(rec.blob)
        setUrl(u)
        setName(rec.name)
      } else if (DEFAULT_AUDIO_MAP[examId]) {
        setUrl(DEFAULT_AUDIO_MAP[examId])
        setName(`file nghe ${examId}.mp3`)
      } else {
        setUrl(null)
        setName('')
      }
      setSegments(segs)
    })()

    return () => {
      live = false
      if (u) URL.revokeObjectURL(u)
    }
  }, [examId, tick])

  return { url, name, segments, reload: () => setTick(t => t + 1) }
}

export interface AudioPlayerProps {
  examId: number
  study?: boolean
  questionNumber?: number
  disabledReason?: string
}

export default function AudioPlayer({
  examId,
  study = false,
  questionNumber,
  disabledReason,
}: AudioPlayerProps) {
  const { url, segments } = useExamAudio(examId)
  const ref = useRef<HTMLAudioElement>(null)
  const segActive = useRef(false)

  const [speed, setSpeed] = useState(1)
  const [playing, setPlaying] = useState(false)
  const [autoPlay, setAutoPlay] = useState(true)
  const [blockedAutoPlay, setBlockedAutoPlay] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)

  // Transcript panel states (independent controlled React states)
  const [showTranscript, setShowTranscript] = useState(false)
  const [showSub, setShowSub] = useState(true)
  const [showPinyin, setShowPinyin] = useState(true)
  const [showMeaning, setShowMeaning] = useState(false)

  // Load initial settings
  useEffect(() => {
    getSettings().then(s => {
      if (s.autoplayAudio !== undefined) {
        setAutoPlay(s.autoplayAudio)
      }
    })
  }, [])

  // Segment for current question
  const isListeningQuestion = questionNumber !== undefined && questionNumber >= 1 && questionNumber <= 20
  const curSeg = isListeningQuestion ? segments[questionNumber] : undefined
  const hasConfirmedSeg = !!curSeg && (curSeg.status === 'confirmed' || curSeg.confirmed === true)
  const hasReviewSeg = !!curSeg && curSeg.status === 'needsReview' && curSeg.end > curSeg.start
  const sol = questionNumber ? getQuestionSolution(examId, questionNumber) : undefined

  // Play speed
  useEffect(() => {
    if (ref.current) ref.current.playbackRate = speed
  }, [speed, url])

  // Stop audio immediately when question changes or leaves listening section (Q21-40)
  const prevQRef = useRef<number | undefined>(questionNumber)
  useEffect(() => {
    const prevQ = prevQRef.current
    prevQRef.current = questionNumber

    const audio = ref.current
    if (!audio) return

    // Leaving listening section (moving to Reading 21-40)
    if (!isListeningQuestion) {
      audio.pause()
      segActive.current = false
      setPlaying(false)
      setBlockedAutoPlay(false)
      return
    }

    // Question changed within listening section
    if (prevQ !== questionNumber) {
      audio.pause()
      segActive.current = false
      setPlaying(false)
      setBlockedAutoPlay(false)

      if (curSeg && (hasConfirmedSeg || hasReviewSeg)) {
        audio.currentTime = curSeg.start
        setCurrentTime(curSeg.start)

        // In Practice mode: autoplay confirmed segment
        if (study && autoPlay && hasConfirmedSeg) {
          segActive.current = true
          const p = audio.play()
          if (p !== undefined) {
            p.then(() => {
              setPlaying(true)
              setBlockedAutoPlay(false)
            }).catch(() => {
              // Browser blocked autoplay
              setBlockedAutoPlay(true)
              setPlaying(false)
              segActive.current = false
            })
          }
        }
      }
    }
  }, [questionNumber, isListeningQuestion, curSeg, hasConfirmedSeg, hasReviewSeg, study, autoPlay])

  // Play current question segment
  const playCurrentSegment = useCallback(() => {
    const audio = ref.current
    if (!audio || !curSeg) return

    audio.currentTime = curSeg.start
    setCurrentTime(curSeg.start)
    segActive.current = true
    const p = audio.play()
    if (p !== undefined) {
      p.then(() => {
        setPlaying(true)
        setBlockedAutoPlay(false)
      }).catch(() => {
        setBlockedAutoPlay(true)
        setPlaying(false)
      })
    }
  }, [curSeg])

  // Replay from segment start
  const replayCurrentSegment = useCallback(() => {
    const audio = ref.current
    if (!audio) return
    if (curSeg && (hasConfirmedSeg || hasReviewSeg)) {
      audio.currentTime = curSeg.start
      setCurrentTime(curSeg.start)
      segActive.current = true
      audio.play().then(() => setPlaying(true)).catch(() => {})
    } else {
      audio.currentTime = 0
      audio.play().then(() => setPlaying(true)).catch(() => {})
    }
  }, [curSeg, hasConfirmedSeg, hasReviewSeg])

  // Pause / Play toggle
  const togglePlayPause = useCallback(() => {
    const audio = ref.current
    if (!audio) return
    if (playing) {
      audio.pause()
      setPlaying(false)
      segActive.current = false
    } else {
      if (isListeningQuestion && curSeg && (hasConfirmedSeg || hasReviewSeg)) {
        if (audio.currentTime < curSeg.start || audio.currentTime >= curSeg.end) {
          audio.currentTime = curSeg.start
        }
        segActive.current = true
      }
      audio.play().then(() => setPlaying(true)).catch(() => {})
    }
  }, [playing, isListeningQuestion, curSeg, hasConfirmedSeg, hasReviewSeg])

  if (disabledReason) {
    return <div className="card p-3 text-sm opacity-80">🔇 {disabledReason}</div>
  }

  if (!url) {
    return (
      <div className="card p-4 text-sm flex items-start gap-3">
        <Upload className="h-5 w-5 mt-0.5 text-jade-600" />
        <div>
          <b>Chưa có audio cho Đề {String(examId).padStart(2, '0')}.</b>
          <br />
          Vào <b>Quản trị → Audio</b> và tải file lên.
        </div>
      </div>
    )
  }

  // Segment duration and progress
  const segDuration = curSeg ? Math.max(0.1, curSeg.end - curSeg.start) : 0
  const segProgress = curSeg ? Math.min(100, Math.max(0, ((currentTime - curSeg.start) / segDuration) * 100)) : 0

  return (
    <div className="card p-4 space-y-3 shadow-soft border border-ink/10 bg-white">
      {/* Hidden audio element with timeupdate tracking */}
      <audio
        ref={ref}
        src={url}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={e => {
          const t = e.currentTarget.currentTime
          setCurrentTime(t)
          // Segment boundary enforcement
          if (segActive.current && curSeg && (hasConfirmedSeg || hasReviewSeg)) {
            if (t >= curSeg.end) {
              e.currentTarget.pause()
              segActive.current = false
              setPlaying(false)
              e.currentTarget.currentTime = curSeg.start
              setCurrentTime(curSeg.start)
            }
          }
        }}
      />

      {/* Autoplay blocked banner */}
      {blockedAutoPlay && isListeningQuestion && (
        <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
          <span className="flex items-center gap-1.5 font-medium">
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
            Trình duyệt yêu cầu tương tác để phát âm thanh câu {questionNumber}.
          </span>
          <button
            type="button"
            className="btn-primary !py-1 !px-2.5 text-xs shrink-0"
            onClick={playCurrentSegment}
          >
            Bấm để nghe
          </button>
        </div>
      )}

      {/* Segment progress bar for Question 1-20 in Study mode */}
      {isListeningQuestion && (hasConfirmedSeg || hasReviewSeg) && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-ink/70">
            <span className="font-semibold text-jade-700">
              Câu {String(questionNumber).padStart(2, '0')} / 20 {playing && segActive.current && '— Đang phát đoạn'}
            </span>
            <span className="font-mono text-xs opacity-75">
              {Math.max(0, currentTime - curSeg.start).toFixed(1)}s / {segDuration.toFixed(1)}s
            </span>
          </div>
          <div
            className="h-2 w-full bg-ink/10 rounded-full overflow-hidden cursor-pointer relative"
            onClick={e => {
              const rect = e.currentTarget.getBoundingClientRect()
              const pct = (e.clientX - rect.left) / rect.width
              const targetTime = curSeg.start + pct * segDuration
              if (ref.current) {
                ref.current.currentTime = targetTime
                setCurrentTime(targetTime)
              }
            }}
          >
            <div
              className={`h-full transition-all duration-100 ${hasConfirmedSeg ? 'bg-jade-600' : 'bg-amber-500'}`}
              style={{ width: `${segProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Main player controls row */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm pt-1">
        {/* Left: Play/Pause and Replay */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={togglePlayPause}
            className={`btn-primary !py-1.5 !px-3 flex items-center gap-1.5 ${playing ? '!bg-amber-600 !border-amber-600' : ''}`}
            aria-label={playing ? 'Tạm dừng' : 'Phát audio'}
          >
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            <span>{playing ? 'Tạm dừng' : isListeningQuestion ? `Phát câu ${questionNumber}` : 'Phát audio'}</span>
          </button>

          <button
            type="button"
            onClick={replayCurrentSegment}
            className="btn-ghost !py-1.5 !px-2.5 flex items-center gap-1 text-xs"
            title="Nghe lại từ đầu câu"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Nghe lại
          </button>
        </div>

        {/* Center: Speeds */}
        <div className="flex items-center gap-1 border border-ink/10 rounded-xl p-0.5 bg-ink/5">
          <Volume2 className="h-3.5 w-3.5 ml-1 text-ink/50" />
          {SPEEDS.map(v => (
            <button
              key={v}
              type="button"
              onClick={() => setSpeed(v)}
              className={`px-1.5 py-0.5 rounded-lg text-xs font-medium transition-colors ${speed === v ? 'bg-jade-600 text-white shadow-sm' : 'text-ink/70 hover:text-ink'}`}
            >
              {v}x
            </button>
          ))}
        </div>

        {/* Right: Autoplay toggle (Only in Study mode) */}
        {study && isListeningQuestion && (
          <button
            type="button"
            onClick={() => setAutoPlay(a => !a)}
            className={`px-2 py-1 rounded-xl text-xs font-medium border transition-colors ${autoPlay ? 'bg-jade-50 text-jade-700 border-jade-300' : 'bg-white text-ink/50 border-ink/15'}`}
            title="Tự động phát audio khi chuyển câu"
          >
            Tự phát: {autoPlay ? 'Bật' : 'Tắt'}
          </button>
        )}
      </div>

      {/* Warning for unconfirmed segment */}
      {isListeningQuestion && !hasConfirmedSeg && hasReviewSeg && (
        <div className="text-xs text-amber-700 bg-amber-50 p-2 rounded-lg flex items-center gap-1">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>Đoạn câu {questionNumber} đang ở trạng thái Cần xem lại (chưa xác nhận chính thức).</span>
        </div>
      )}

      {/* Transcript control row (Only in Study / Practice mode - NEVER in Exam mode) */}
      {study && sol && (
        <div className="border-t border-ink/10 pt-2.5 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setShowTranscript(t => !t)}
              className={`btn-ghost !py-1 !px-2.5 text-xs flex items-center gap-1.5 rounded-xl border ${showTranscript ? 'bg-jade-50 text-jade-700 border-jade-300 font-semibold' : 'text-ink/70 border-ink/15'}`}
            >
              <FileText className="h-3.5 w-3.5" />
              {showTranscript ? 'Ẩn transcript' : 'Hiện transcript'}
            </button>

            {/* Sub-toggles when transcript is opened */}
            {showTranscript && (
              <div className="flex items-center gap-1 text-xs">
                <button
                  type="button"
                  onClick={() => setShowSub(s => !s)}
                  className={`px-2 py-0.5 rounded-lg border flex items-center gap-1 transition-colors ${showSub ? 'bg-jade-100 text-jade-800 border-jade-300 font-medium' : 'bg-white text-ink/40 border-ink/10'}`}
                >
                  <Eye className="h-3 w-3" /> Sub (Hán tự)
                </button>
                <button
                  type="button"
                  onClick={() => setShowPinyin(p => !p)}
                  className={`px-2 py-0.5 rounded-lg border flex items-center gap-1 transition-colors ${showPinyin ? 'bg-jade-100 text-jade-800 border-jade-300 font-medium' : 'bg-white text-ink/40 border-ink/10'}`}
                >
                  <Languages className="h-3 w-3" /> Pinyin
                </button>
                <button
                  type="button"
                  onClick={() => setShowMeaning(m => !m)}
                  className={`px-2 py-0.5 rounded-lg border flex items-center gap-1 transition-colors ${showMeaning ? 'bg-jade-100 text-jade-800 border-jade-300 font-medium' : 'bg-white text-ink/40 border-ink/10'}`}
                >
                  {showMeaning ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />} Bản dịch
                </button>
              </div>
            )}
          </div>

          {/* Transcript Panel Content */}
          {showTranscript && (
            <div className="p-3.5 rounded-xl bg-jade-50/50 border border-jade-200 text-left space-y-2 animate-fadeIn">
              {showSub && (
                <div className="hanzi text-xl font-medium text-ink leading-relaxed">
                  {sol.hanzi}
                </div>
              )}
              {showPinyin && sol.pinyin && (
                <div className="pinyin text-sm text-jade-700 font-medium">
                  {sol.pinyin}
                </div>
              )}
              {showMeaning && sol.explanation && (
                <div className="text-xs text-ink/80 pt-1 border-t border-jade-100 leading-normal">
                  <b>Nghĩa Việt:</b> {sol.explanation}
                </div>
              )}
              {sol.dialogChoices && (
                <div className="text-xs text-ink/70 pt-1 border-t border-jade-100">
                  <b>Lựa chọn:</b> {sol.dialogChoices}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
