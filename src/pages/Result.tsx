import { useEffect, useState, useMemo } from 'react'
import { AlertTriangle, RotateCcw, CheckCircle2, XCircle, HelpCircle, BookOpen, Volume2, Filter } from 'lucide-react'
import { db, getKey } from '../lib/db'
import { getExam, imageUrl, hasImage, SECTION_LABEL } from '../lib/data'
import { scoreAttempt } from '../lib/scoring'
import { getOfficialAnswers, getExamSolution } from '../lib/solutions'
import { SolutionCard } from '../components/SolutionCard'
import AudioPlayer from '../components/AudioPlayer'
import { pad, fmtDate } from '../components/ui'
import type { Attempt, Answers, Question } from '../types'
import type { View } from '../App'

type FilterMode = 'all' | 'wrong' | 'listening' | 'reading'

export default function Result({ attemptId, go }: { attemptId: number; go: (v: View) => void }) {
  const [a, setA] = useState<Attempt | null>(null)
  const [key, setKey] = useState<Answers | null>(null)
  const [filter, setFilter] = useState<FilterMode>('all')

  useEffect(() => {
    db.attempts.get(attemptId).then(async x => {
      if (!x) return
      setA(x)
      const k = (await getKey(x.examId)) ?? getOfficialAnswers(x.examId) ?? null
      setKey(k)
    })
  }, [attemptId])

  if (!a) return <div className="p-8">Đang tải kết quả…</div>

  const exam = getExam(a.examId)
  const solutions = getExamSolution(a.examId)
  const effectiveKey = key ?? getOfficialAnswers(a.examId) ?? null
  const r = effectiveKey ? scoreAttempt(exam, a.answers, effectiveKey, a.result?.pointsPerQuestion ?? 5) : a.result!

  const wrongCount = r.wrong.length
  const blankCount = r.blank.length
  const correctCount = r.correct
  const passScore = 120
  const isPassed = r.total != null && r.total >= passScore

  const filteredQuestions = exam.questions.filter(q => {
    const qn = q.questionNumber
    if (filter === 'wrong') {
      return r.wrong.includes(qn) || r.blank.includes(qn)
    }
    if (filter === 'listening') return q.section === 'listening'
    if (filter === 'reading') return q.section === 'reading'
    return true
  })

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold flex flex-wrap items-center gap-3">
          Kết quả Đề {pad(a.examId)}
          <span className={`text-sm px-3 py-1 rounded-full font-semibold ${isPassed ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
            {isPassed ? '✓ ĐẠT (≥ 120 điểm)' : '✗ CHƯA ĐẠT (< 120 điểm)'}
          </span>
        </h1>
        <p className="text-sm opacity-60 mt-1">
          Chế độ: <b>{a.mode === 'exam' ? 'Thi thử' : 'Luyện tập'}</b> · Hoàn thành: {fmtDate(a.finishedAt)}
        </p>
      </div>

      {r.gradable !== 'full' && (
        <div className="card p-4 border-l-4 border-amber-400 flex gap-3">
          <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <b>{r.gradable === 'none' ? 'Chưa thể chấm điểm: đề này chưa có đáp án xác thực.' : `Chỉ chấm được ${r.gradedCount}/40 câu có đáp án.`}</b>
            <br />Bổ sung ở <b>Quản trị → Đáp án</b>, rồi mở lại kết quả này để chấm lại.
          </div>
        </div>
      )}

      {/* Main Score Cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { label: 'Tổng điểm', val: r.total, max: 200, color: isPassed ? 'text-emerald-600' : 'text-amber-700' },
          { label: 'Phần Nghe (听力)', val: r.listening, max: 100, color: 'text-jade-600' },
          { label: 'Phần Đọc (阅读)', val: r.reading, max: 100, color: 'text-jade-600' },
        ].map(item => (
          <div key={item.label} className="card p-5 text-center">
            <div className="text-xs uppercase tracking-wide opacity-70 font-semibold mb-1">{item.label}</div>
            <div className={`text-4xl font-extrabold ${item.color}`}>
              {item.val == null ? '—' : item.val}
              <span className="text-sm font-normal opacity-50 text-ink ml-1">/{item.max}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Accuracy stats */}
      <div className="card p-4 flex flex-wrap items-center justify-around gap-4 text-sm text-center">
        <div>
          <span className="text-xs opacity-60 block">Đúng</span>
          <b className="text-lg text-emerald-600">{correctCount}</b> / 40 câu
        </div>
        <div className="h-8 border-r border-ink/10" />
        <div>
          <span className="text-xs opacity-60 block">Sai</span>
          <b className="text-lg text-rose-600">{wrongCount}</b> câu
        </div>
        <div className="h-8 border-r border-ink/10" />
        <div>
          <span className="text-xs opacity-60 block">Bỏ trống</span>
          <b className="text-lg text-amber-600">{blankCount}</b> câu
        </div>
        <div className="h-8 border-r border-ink/10" />
        <div>
          <span className="text-xs opacity-60 block">Tỷ lệ chính xác</span>
          <b className="text-lg text-jade-700">{Math.round((correctCount / 40) * 100)}%</b>
        </div>
      </div>

      {/* Audio player for reviewing listening section */}
      <div className="card p-4 space-y-2">
        <div className="flex items-center gap-2 font-semibold text-sm text-jade-800">
          <Volume2 className="h-4 w-4" /> Nghe lại audio Đề {pad(a.examId)} khi xem lời thoại
        </div>
        <AudioPlayer examId={a.examId} study />
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        {wrongCount > 0 && (
          <button className="btn-primary" onClick={() => go({ name: 'review' })}>
            <RotateCcw className="h-4 w-4" /> Ôn {wrongCount} câu sai ngay
          </button>
        )}
        <button className="btn-ghost" onClick={() => go({ name: 'exam', examId: a.examId, mode: a.mode })}>
          Làm lại đề này
        </button>
        <button className="btn-ghost" onClick={() => go({ name: 'exams' })}>
          Danh sách đề
        </button>
      </div>

      {/* Detailed Review Section */}
      <div className="space-y-4 pt-4 border-t border-ink/10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-jade-600" /> Chi tiết lời giải 40 câu
          </h2>

          {/* Filter options */}
          <div className="flex items-center gap-1 text-xs bg-ink/5 p-1 rounded-xl">
            {(
              [
                ['all', `Tất cả (40)`],
                ['wrong', `Câu sai/bỏ trống (${wrongCount + blankCount})`],
                ['listening', `Nghe (1–20)`],
                ['reading', `Đọc (21–40)`],
              ] as [FilterMode, string][]
            ).map(([modeKey, labelText]) => (
              <button
                key={modeKey}
                onClick={() => setFilter(modeKey)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${filter === modeKey ? 'bg-white text-jade-800 shadow-sm' : 'text-ink/60 hover:text-ink'}`}
              >
                {labelText}
              </button>
            ))}
          </div>
        </div>

        {filteredQuestions.length === 0 ? (
          <div className="card p-6 text-center text-sm opacity-70">
            Không có câu hỏi nào theo bộ lọc đã chọn.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredQuestions.map(q => {
              const qn = q.questionNumber
              const userAns = a.answers[qn]
              const correctAns = effectiveKey?.[qn]
              const isCorrect = userAns && userAns === correctAns
              const isWrong = userAns && userAns !== correctAns
              const isBlank = !userAns
              const sol = solutions?.items?.[qn]

              return (
                <div
                  key={qn}
                  className={`card p-5 border-l-4 ${isCorrect ? 'border-l-emerald-500' : isWrong ? 'border-l-rose-500' : 'border-l-amber-400'}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs uppercase tracking-wide font-semibold text-jade-700">
                      {SECTION_LABEL[q.section]} · Câu {pad(qn)}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isCorrect ? 'bg-emerald-100 text-emerald-800' : isWrong ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}`}>
                      {isCorrect ? '✓ Đúng (+5 điểm)' : isWrong ? '✗ Sai' : '○ Bỏ trống'}
                    </span>
                  </div>

                  {/* Images if available */}
                  {(q.imageIds.length > 0 || q.choices.some(c => c.imageId)) && (
                    <div className="flex flex-wrap gap-2 my-2 justify-center">
                      {[...q.imageIds, ...q.choices.map(c => c.imageId).filter(Boolean) as string[]].map(id => (
                        <div key={id} className="flex flex-col items-center">
                          <img
                            src={imageUrl(id)}
                            alt={`Hình ${id}`}
                            className="h-28 w-28 object-contain rounded-xl bg-white border border-ink/5"
                            draggable={false}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Solution Card with Transcript, Pinyin, Vietnamese meaning */}
                  {sol ? (
                    <SolutionCard item={sol} userAnswer={userAns} />
                  ) : (
                    <div className="text-sm opacity-60 mt-2">
                      Bạn chọn: <b>{userAns ?? '—'}</b> · Đáp án đúng: <b>{correctAns ?? '—'}</b>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
