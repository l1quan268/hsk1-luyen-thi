import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Flag, Pause, Play, Send, Star, BookmarkPlus, Eye, X } from 'lucide-react'
import { getExam, SECTION_LABEL } from '../lib/data'; import { db, getKey, getSettings, type Settings, DEFAULT_SETTINGS } from '../lib/db'
import { assignAnswer, isUniqueGroup } from '../lib/answers'; import { scoreAttempt } from '../lib/scoring'; import { newReviewItem } from '../lib/srs'
import { QuestionView } from '../components/QuestionView'; import AudioPlayer from '../components/AudioPlayer'
import { SolutionCard } from '../components/SolutionCard'
import { getOfficialAnswers, getQuestionSolution } from '../lib/solutions'
import { Modal, useToast, fmtTime, pad } from '../components/ui'; import type { Attempt, Answers, Mode } from '../types'

export default function ExamRunner({ examId, mode, onExit, onFinish }: { examId: number; mode: Mode; onExit: () => void; onFinish: (id: number) => void }) {
  const exam = getExam(examId); const toast = useToast()
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS); const [att, setAtt] = useState<Attempt | null>(null)
  const [paused, setPaused] = useState(false); const [confirm, setConfirm] = useState(false); const [leave, setLeave] = useState(false)
  const [showPinyin, setShowPinyin] = useState(true); const [practiceKey, setPracticeKey] = useState<Answers | null>(null); const [revealed, setRevealed] = useState<Set<number>>(new Set())
  const attRef = useRef<Attempt | null>(null); attRef.current = att

  useEffect(() => { (async () => {
    const s = await getSettings(); setSettings(s); setShowPinyin(s.showPinyin)
    const existing = (await db.attempts.where('examId').equals(examId).toArray()).find(a => a.status === 'in_progress' && a.mode === mode)
    if (existing) { setAtt(existing); return }
    const limit = mode === 'exam' && s.timerEnabled ? s.timerMinutes * 60 : null
    const fresh: Attempt = { examId, mode, answers: {}, flags: [], hard: [], startedAt: Date.now(), limitSec: limit, remainingSec: limit, status: 'in_progress', current: 1 }
    const id = await db.attempts.add(fresh); setAtt({ ...fresh, id })
    // Chỉ nạp answer key ở chế độ luyện tập; chế độ thi chỉ nạp khi nộp bài.
    if (mode === 'practice') {
      const k = (await getKey(examId)) ?? getOfficialAnswers(examId) ?? null
      setPracticeKey(k)
    }
  })() }, [examId, mode])
  useEffect(() => {
    if (mode === 'practice') {
      getKey(examId).then(k => setPracticeKey(k ?? getOfficialAnswers(examId) ?? null))
    }
  }, [mode, examId])

  const persist = useCallback(async (a: Attempt) => { if (a.id != null) await db.attempts.put(a) }, [])
  const update = useCallback((fn: (a: Attempt) => Attempt) => setAtt(prev => { if (!prev) return prev; const n = fn(prev); persist(n); return n }), [persist])

  // đồng hồ
  const submitRef = useRef<() => void>(() => {}); 
  useEffect(() => { if (mode !== 'exam' || att?.remainingSec == null || paused || att.status !== 'in_progress') return
    const t = setInterval(() => { const a = attRef.current; if (!a || a.remainingSec == null) return
      const r = a.remainingSec - 1; if (r <= 0) { submitRef.current(); return }
      setAtt({ ...a, remainingSec: r }); if (r % 5 === 0) persist({ ...a, remainingSec: r }) }, 1000)
    return () => clearInterval(t) }, [mode, att?.status, att?.remainingSec == null, paused, persist])

  const idx = att?.current ?? 1; const q = exam.questions[idx - 1]
  const usedLabels = useMemo(() => { const m = new Map<string, number>(); if (att && q && isUniqueGroup(q)) for (const o of exam.questions) if (o.group === q.group && att.answers[o.questionNumber]) m.set(att.answers[o.questionNumber], o.questionNumber); return m }, [att?.answers, q, exam])
  const go = useCallback((n: number) => update(a => ({ ...a, current: Math.min(40, Math.max(1, n)) })), [update])
  const pick = useCallback((label: string) => { if (!att || !q || paused) return
    const r = assignAnswer(exam, att.answers, q, label); update(a => ({ ...a, answers: r.answers }))
    if (r.displaced) toast(`Lựa chọn ${label} đã chuyển từ câu ${r.displaced} sang câu ${q.questionNumber}`) }, [att, q, paused, exam, update, toast])

  const submit = useCallback(async () => { const a = attRef.current; if (!a) return
    const key = (await getKey(examId)) ?? getOfficialAnswers(examId) ?? null
    const s = await getSettings()
    const result = scoreAttempt(exam, a.answers, key, s.pointsPerQuestion)
    const done: Attempt = { ...a, status: 'submitted', finishedAt: Date.now(), result }; await db.attempts.put(done)
    for (const n of result.wrong) { const id = `${examId}-${n}`; if (!(await db.review.get(id))) await db.review.put(newReviewItem(examId, n)) }
    onFinish(done.id!) }, [exam, examId, onFinish])
  submitRef.current = submit

  // bàn phím
  useEffect(() => { const h = (e: KeyboardEvent) => { const t = e.target as HTMLElement; if (/INPUT|TEXTAREA|SELECT/.test(t.tagName) || t.isContentEditable || e.ctrlKey || e.metaKey) return
      if (e.key === 'ArrowRight') go(idx + 1); else if (e.key === 'ArrowLeft') go(idx - 1)
      else if (q) { const k = e.key.toUpperCase(); const labels = q.choices.map(c => c.label)
        if (/^[1-6]$/.test(k)) { const c = q.choices[Number(k) - 1]; if (c) pick(c.label) }
        else if (labels.includes(k)) pick(k) } }
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h) }, [go, idx, q, pick])

  if (!att || !q) return <div className="p-8">Đang tải…</div>
  const answered = Object.keys(att.answers).length; const blank = 40 - answered
  const status = (n: number) => att.answers[n] ? 'done' : 'todo'
  const reveal = mode === 'practice' && revealed.has(q.questionNumber) && practiceKey ? practiceKey[q.questionNumber] ?? null : null
  const audioOff = mode === 'exam' && settings.examAudio === 'off'
  const saveVocab = async () => { const items = q.questionType === 'read_fill_bank' || q.questionType === 'read_match_answer' || q.questionType === 'listen_dialog_choice' ? q.choices : []
    const base = q.hanzi ? [{ hanzi: q.hanzi, pinyin: q.pinyin }] : items.map(c => ({ hanzi: c.hanzi ?? '', pinyin: c.pinyin ?? '' }))
    for (const b of base) if (b.hanzi) await db.vocab.put({ id: b.hanzi, hanzi: b.hanzi, pinyin: b.pinyin, saved: true }); toast('Đã lưu vào Từ vựng', 'ok') }

  return (<div className="max-w-3xl mx-auto">
    <header className="flex items-center gap-3 mb-3">
      <button className="btn-ghost !p-2" aria-label="Thoát" onClick={() => setLeave(true)}><X className="h-5 w-5" /></button>
      <div className="flex-1"><div className="h-2 rounded bg-jade-50"><div className="h-2 rounded bg-jade-500" style={{ width: `${answered / 40 * 100}%` }} /></div>
        <div className="text-xs mt-1 opacity-70">Đề {pad(examId)} · {mode === 'exam' ? 'Thi thử' : 'Luyện tập'} · đã làm {answered}/40</div></div>
      {mode === 'exam' && att.remainingSec != null && <div className={`font-mono text-lg ${att.remainingSec < 300 ? 'text-rose-600' : ''}`}>{fmtTime(att.remainingSec)}</div>}
      {mode === 'exam' && att.remainingSec != null && settings.allowPause && <button className="btn-ghost !p-2" aria-label={paused ? 'Tiếp tục' : 'Tạm dừng'} onClick={() => setPaused(p => !p)}>{paused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}</button>}
      {mode === 'practice' && <label className="text-sm flex items-center gap-1"><input type="checkbox" checked={showPinyin} onChange={e => setShowPinyin(e.target.checked)} />Pinyin</label>}
    </header>

    <div className={q.section === 'listening' ? 'mb-3' : 'hidden'}><AudioPlayer examId={examId} study={mode === 'practice'} questionNumber={q.questionNumber} disabledReason={audioOff ? 'Audio đã tắt trong chế độ thi (Cài đặt → chính sách audio).' : undefined} /></div>

    <section className="card p-5 sm:p-7">
      <div className="flex items-center justify-between mb-1"><span className="text-xs uppercase tracking-wide text-jade-600 font-semibold">{SECTION_LABEL[q.section]} · nhóm {exam.groups.find(g => g.from === q.group)?.roman ?? ''}</span>
        <span className="font-bold">Câu {pad(q.questionNumber)}/40</span></div>
      <p className="text-sm opacity-70 mb-4">{exam.groups.find(g => g.from === q.group)?.instruction}</p>
      {paused ? <div className="py-16 text-center opacity-70">Đã tạm dừng. Nội dung được ẩn.</div> :
        <QuestionView exam={exam} q={q} value={att.answers[q.questionNumber]} onPick={pick} showPinyin={showPinyin} revealKey={reveal} usedLabels={usedLabels} />}
      {mode === 'practice' && !paused && (
        <div className="mt-5 space-y-4">
          <div className="flex flex-wrap gap-2 items-center">
            <button
              type="button"
              className="btn-ghost"
              onClick={() => {
                if (!practiceKey?.[q.questionNumber]) {
                  toast('Chưa có đáp án xác thực cho câu này.', 'error')
                  return
                }
                setRevealed(prev => {
                  const next = new Set(prev)
                  if (next.has(q.questionNumber)) {
                    next.delete(q.questionNumber)
                  } else {
                    next.add(q.questionNumber)
                  }
                  return next
                })
              }}
            >
              <Eye className="h-4 w-4" />
              {revealed.has(q.questionNumber) ? 'Ẩn đáp án & giải thích' : 'Xem đáp án & giải thích'}
            </button>
            <button className="btn-ghost" onClick={() => update(a => ({ ...a, hard: a.hard.includes(q.questionNumber) ? a.hard.filter(x => x !== q.questionNumber) : [...a.hard, q.questionNumber] }))}><Star className={`h-4 w-4 ${att.hard.includes(q.questionNumber) ? 'fill-amber-400' : ''}`} />Câu khó</button>
            <button className="btn-ghost" onClick={saveVocab}><BookmarkPlus className="h-4 w-4" />Lưu từ vựng</button>
          </div>
          {revealed.has(q.questionNumber) && (() => {
            const sol = getQuestionSolution(examId, q.questionNumber)
            if (!sol) return <span className="text-sm opacity-70">Chưa có giải thích cho câu này.</span>
            return <SolutionCard item={sol} userAnswer={att.answers[q.questionNumber]} />
          })()}
        </div>
      )}
    </section>

    <div className="flex items-center justify-between mt-4 gap-2">
      <button className="btn-ghost" disabled={idx === 1} onClick={() => go(idx - 1)}><ChevronLeft className="h-4 w-4" />Trước</button>
      <button className={`btn-ghost ${att.flags.includes(idx) ? '!bg-amber-50 !border-amber-300' : ''}`} onClick={() => update(a => ({ ...a, flags: a.flags.includes(idx) ? a.flags.filter(x => x !== idx) : [...a.flags, idx] }))}><Flag className="h-4 w-4" />{att.flags.includes(idx) ? 'Bỏ đánh dấu' : 'Đánh dấu'}</button>
      {idx < 40 ? <button className="btn-primary" onClick={() => go(idx + 1)}>Sau<ChevronRight className="h-4 w-4" /></button> : <button className="btn-primary" onClick={() => setConfirm(true)}><Send className="h-4 w-4" />Nộp bài</button>}
    </div>

    <nav className="card p-4 mt-5" aria-label="Điều hướng câu hỏi">
      <div className="grid grid-cols-10 gap-1.5">{exam.questions.map(x => { const n = x.questionNumber; const cur = n === idx; const fl = att.flags.includes(n)
        return <button key={n} onClick={() => go(n)} aria-label={`Câu ${n} ${status(n) === 'done' ? 'đã làm' : 'chưa làm'}${fl ? ', đã đánh dấu' : ''}`} className={`relative h-9 rounded-lg text-sm font-medium border ${cur ? 'ring-2 ring-jade-600' : ''} ${status(n) === 'done' ? 'bg-jade-500 text-white border-jade-500' : 'bg-white border-ink/15'}`}>{n}{fl && <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-amber-400" />}</button> })}</div>
      <div className="flex gap-4 text-xs mt-3 opacity-70"><span>■ đã làm</span><span>□ chưa làm</span><span className="text-amber-600">● đánh dấu</span></div>
      <button className="btn-primary mt-3" onClick={() => setConfirm(true)}><Send className="h-4 w-4" />Nộp bài</button>
    </nav>

    {confirm && <Modal title="Nộp bài?" onClose={() => setConfirm(false)} actions={<><button className="btn-ghost" onClick={() => setConfirm(false)}>Làm tiếp</button><button className="btn-primary" onClick={submit}>Nộp bài</button></>}>
      {blank > 0 ? <p className="text-amber-700">⚠ Còn <b>{blank}</b> câu chưa làm: {exam.questions.filter(x => !att.answers[x.questionNumber]).map(x => x.questionNumber).join(', ')}.</p> : <p>Bạn đã trả lời đủ 40 câu.</p>}
      {att.flags.length > 0 && <p>Câu đã đánh dấu: {att.flags.join(', ')}.</p>}</Modal>}
    {leave && <Modal title="Thoát bài làm?" onClose={() => setLeave(false)} actions={<><button className="btn-ghost" onClick={() => setLeave(false)}>Ở lại</button><button className="btn-primary" onClick={onExit}>Thoát (đã tự lưu)</button></>}><p>Tiến độ được lưu tự động. Bạn có thể tiếp tục sau.</p></Modal>}
  </div>)
}
