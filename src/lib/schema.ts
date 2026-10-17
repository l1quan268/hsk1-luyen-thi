import type { Exam, Answers, QType } from '../types'
const QTYPES: QType[] = ['listen_tf_image','listen_pick_image','match_image_bank','listen_dialog_choice','read_tf_image','read_pick_image','read_match_answer','read_fill_bank']
export interface Issue { path: string; message: string }
export function validateExam(x: any): Issue[] {
  const e: Issue[] = []
  if (!x || typeof x !== 'object') return [{ path: '', message: 'Không phải object' }]
  if (!Number.isInteger(x.examId) || x.examId < 1) e.push({ path: 'examId', message: 'examId không hợp lệ' })
  if (!Array.isArray(x.questions)) { e.push({ path: 'questions', message: 'Thiếu questions' }); return e }
  if (x.questions.length !== 40) e.push({ path: 'questions', message: `Cần 40 câu, có ${x.questions.length}` })
  const seen = new Set<number>()
  x.questions.forEach((q: any, i: number) => {
    const p = `questions[${i}]`
    if (!Number.isInteger(q.questionNumber) || q.questionNumber < 1 || q.questionNumber > 40) e.push({ path: p, message: 'questionNumber ngoài 1–40' })
    else if (seen.has(q.questionNumber)) e.push({ path: p, message: `Trùng câu ${q.questionNumber}` }); else seen.add(q.questionNumber)
    if (!QTYPES.includes(q.questionType)) e.push({ path: p, message: `questionType lạ: ${q.questionType}` })
    if (!['listening','reading'].includes(q.section)) e.push({ path: p, message: 'section không hợp lệ' })
    if (!Array.isArray(q.imageIds) || !Array.isArray(q.choices)) e.push({ path: p, message: 'imageIds/choices phải là mảng' })
  })
  return e
}
/** Định dạng file đáp án: { "examId": 1, "answers": { "1": "T", "6": "B", ... } } hoặc { "exams": { "1": {...}, "2": {...} } } */
export function parseAnswerFile(raw: any, exams: Exam[]): { keys: Record<number, Answers>; issues: Issue[] } {
  const issues: Issue[] = []; const keys: Record<number, Answers> = {}
  const blocks: Record<string, any> = raw?.exams ?? (raw?.examId ? { [raw.examId]: raw.answers } : {})
  if (!Object.keys(blocks).length) issues.push({ path: '', message: 'Không tìm thấy khối đáp án (examId/answers hoặc exams)' })
  for (const [id, ans] of Object.entries(blocks)) {
    const ex = exams.find(e => e.examId === Number(id))
    if (!ex) { issues.push({ path: `exams.${id}`, message: 'Đề không tồn tại' }); continue }
    const out: Answers = {}
    for (const [n, v] of Object.entries((ans as any)?.answers ?? ans ?? {})) {
      const q = ex.questions.find(q => q.questionNumber === Number(n))
      const label = String(v).trim().toUpperCase()
      if (!q) { issues.push({ path: `exams.${id}.${n}`, message: 'Không có câu này' }); continue }
      const valid = q.choices.map(c => c.label)
      if (!valid.includes(label)) { issues.push({ path: `exams.${id}.${n}`, message: `Đáp án "${v}" không thuộc ${valid.join('/')}` }); continue }
      out[q.questionNumber] = label
    }
    // duy nhất cho 11–15 và 31–35
    for (const g of [11, 31]) { const used = new Map<string, number>(); for (const q of ex.questions.filter(q => q.group === g)) { const l = out[q.questionNumber]; if (!l) continue; if (used.has(l)) issues.push({ path: `exams.${id}.${q.questionNumber}`, message: `Nhãn ${l} trùng với câu ${used.get(l)} (mỗi lựa chọn chỉ dùng một lần)` }); else used.set(l, q.questionNumber) } }
    keys[Number(id)] = out
  }
  return { keys, issues }
}
