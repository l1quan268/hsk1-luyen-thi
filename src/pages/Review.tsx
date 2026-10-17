import { useEffect, useState } from 'react'
import { db, getKey } from '../lib/db'
import { getExam } from '../lib/data'
import { isDue, nextReview, type ReviewItem } from '../lib/srs'
import { QuestionView } from '../components/QuestionView'
import { assignAnswer } from '../lib/answers'
import { pad, fmtDate } from '../components/ui'
import { getOfficialAnswers, getQuestionSolution } from '../lib/solutions'
import { SolutionCard } from '../components/SolutionCard'

export default function Review() {
  const [items, setItems] = useState<ReviewItem[]>([])
  const [cur, setCur] = useState<ReviewItem | null>(null)
  const [val, setVal] = useState<string>()
  const [key, setKey] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const load = async () => {
    const all = await db.review.toArray()
    setItems(all)
    const due = all.filter(i => isDue(i))
    setCur(due[0] ?? null)
    setVal(undefined)
    setDone(false)
    if (due[0]) {
      const dbK = (await getKey(due[0].examId))?.[due[0].questionNumber]
      const offK = getOfficialAnswers(due[0].examId)?.[due[0].questionNumber]
      setKey(dbK ?? offK ?? null)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const rate = async (ok: boolean) => {
    await db.review.put(nextReview(cur!, ok))
    load()
  }

  const exam = cur ? getExam(cur.examId) : null
  const q = exam?.questions[cur ? cur.questionNumber - 1 : 0]
  const sol = cur ? getQuestionSolution(cur.examId, cur.questionNumber) : undefined

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold mb-1">Ôn câu sai</h1>
      <p className="text-sm opacity-70 mb-4">
        Lặp lại ngắt quãng theo chu kỳ 1 → 3 → 7 ngày (nhớ: lên bậc, quên: về 1 ngày). Tổng cộng: <b>{items.length}</b> câu · Đến hạn ôn: <b>{items.filter(i => isDue(i)).length}</b> câu.
      </p>

      {!cur && (
        <div className="card p-8 text-center space-y-2">
          <div className="text-lg font-medium text-jade-700">Tuyệt vời! Hiện không có câu nào đến hạn ôn tập.</div>
          {items.length > 0 && (
            <p className="text-sm opacity-60">
              Câu tiếp theo sẽ đến hạn vào: {fmtDate(Math.min(...items.map(i => i.due)))}.
            </p>
          )}
        </div>
      )}

      {cur && exam && q && (
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between text-xs opacity-60 border-b border-ink/5 pb-2">
            <span>Đề {pad(cur.examId)} · Câu {cur.questionNumber}</span>
            <span>Bậc ghi nhớ: {cur.step + 1}</span>
          </div>

          <QuestionView
            exam={exam}
            q={q}
            value={val}
            onPick={l => setVal(assignAnswer(exam, val ? { [q.questionNumber]: val } : {}, q, l).answers[q.questionNumber])}
            showPinyin
            revealKey={done ? key : null}
          />

          {!done ? (
            <button className="btn-primary mt-4" onClick={() => setDone(true)}>
              Kiểm tra & Xem giải thích
            </button>
          ) : (
            <div className="mt-4 space-y-4">
              {sol ? (
                <SolutionCard item={sol} userAnswer={val} />
              ) : (
                <div className="p-3 bg-jade-50 rounded-xl text-sm">
                  Đáp án đúng: <b>{key === 'T' ? 'Đúng' : key === 'F' ? 'Sai' : key}</b> {val === key ? '✓' : '✗'}
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <span className="text-sm font-medium">Bạn có nhớ câu này không?</span>
                <button className="btn-primary" onClick={() => rate(true)}>
                  ✓ Đã nhớ
                </button>
                <button className="btn-ghost" onClick={() => rate(false)}>
                  ✗ Chưa nhớ
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
