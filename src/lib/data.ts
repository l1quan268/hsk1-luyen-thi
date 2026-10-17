import type { Exam, Question } from '../types'
import assets from '../data/assets.json'
import e1 from '../data/exam01.json'; import e2 from '../data/exam02.json'; import e3 from '../data/exam03.json'
import e4 from '../data/exam04.json'; import e5 from '../data/exam05.json'; import e6 from '../data/exam06.json'
/** Loại bỏ mọi trường đáp án khỏi dữ liệu dùng cho UI (kể cả khi nguồn JSON sau này có correctAnswer). */
function toPublic(raw: any): Exam {
  const questions: Question[] = raw.questions.map((q: any) => { const { correctAnswer, answerStatus, ...rest } = q; return rest as Question })
  return { examId: raw.examId, title: raw.title, group: raw.group, lesson: raw.lesson, groups: raw.groups, questions }
}
export const EXAMS: Exam[] = [e1, e2, e3, e4, e5, e6].map(toPublic)
export const getExam = (id: number) => EXAMS.find(e => e.examId === id)!
const fileById = new Map((assets as any[]).map(a => [a.id, a.file as string]))
export const imageUrl = (id: string) => `${import.meta.env.BASE_URL}${fileById.get(id) ?? ''}`
export const hasImage = (id: string) => fileById.has(id)
export const ASSET_COUNT = fileById.size
export const SECTION_LABEL = { listening: 'Nghe 听力', reading: 'Đọc 阅读' } as const
