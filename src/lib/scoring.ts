import type { Answers, Exam, ScoreResult, GroupScore } from '../types'
export const POINTS_PER_QUESTION = 5 // quy ước của web: 40 câu × 5 = 200; KHÔNG phải điểm HSK chính thức
export function scoreAttempt(exam: Exam, answers: Answers, key: Answers | null, pts = POINTS_PER_QUESTION): ScoreResult {
  const k = key ?? {}
  const perGroupMap = new Map<number, GroupScore>()
  const wrong: number[] = [], blank: number[] = [], ungraded: number[] = []
  let correct = 0, graded = 0, lc = 0, rc = 0, lg = 0, rg = 0
  for (const q of exam.questions) {
    const n = q.questionNumber
    const g = perGroupMap.get(q.group) ?? { group: q.group, correct: 0, graded: 0, total: 0 }
    g.total++
    const kv = k[n]
    if (!kv) { ungraded.push(n); perGroupMap.set(q.group, g); continue }
    graded++; g.graded++
    if (q.section === 'listening') lg++; else rg++
    const a = answers[n]
    if (!a) blank.push(n)
    else if (a === kv) { correct++; g.correct++; if (q.section === 'listening') lc++; else rc++ }
    else wrong.push(n)
    perGroupMap.set(q.group, g)
  }
  const total = exam.questions.length
  const gradable = graded === 0 ? 'none' : graded === total ? 'full' : 'partial'
  return { gradable, gradedCount: graded, correct, pointsPerQuestion: pts,
    listening: lg === 20 ? lc * pts : null, reading: rg === 20 ? rc * pts : null,
    total: gradable === 'full' ? correct * pts : null,
    perGroup: [...perGroupMap.values()].sort((a, b) => a.group - b.group), wrong, blank, ungraded }
}
