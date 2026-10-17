import type { Answers, Exam, Question } from '../types'
/** Nhóm yêu cầu mỗi lựa chọn chỉ dùng một lần: ghép hình 11–15 (theo đề) và nối câu 31–35 (5↔5, giả định). */
export const UNIQUE_GROUPS = new Set([11, 31])
export function isUniqueGroup(q: Question) { return UNIQUE_GROUPS.has(q.group) }
/** Gán đáp án; nếu nhóm yêu cầu duy nhất và nhãn đã dùng ở câu khác thì gỡ khỏi câu đó. Trả về câu bị gỡ (nếu có). */
export function assignAnswer(exam: Exam, answers: Answers, q: Question, label: string): { answers: Answers; displaced: number | null } {
  const next = { ...answers }
  let displaced: number | null = null
  if (next[q.questionNumber] === label) { delete next[q.questionNumber]; return { answers: next, displaced } } // bấm lại = bỏ chọn
  if (isUniqueGroup(q)) {
    for (const o of exam.questions) if (o.group === q.group && o.questionNumber !== q.questionNumber && next[o.questionNumber] === label) { delete next[o.questionNumber]; displaced = o.questionNumber }
  }
  next[q.questionNumber] = label
  return { answers: next, displaced }
}
export function findDuplicates(exam: Exam, answers: Answers): number[][] {
  const out: number[][] = []
  for (const g of UNIQUE_GROUPS) {
    const seen = new Map<string, number[]>()
    for (const q of exam.questions) if (q.group === g && answers[q.questionNumber]) { const l = answers[q.questionNumber]; seen.set(l, [...(seen.get(l) ?? []), q.questionNumber]) }
    for (const v of seen.values()) if (v.length > 1) out.push(v)
  }
  return out
}
