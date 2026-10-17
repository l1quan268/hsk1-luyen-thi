import { EXAMS } from '../src/lib/data'
export const exam1 = EXAMS[0]
/** Đáp án GIẢ chỉ dùng cho test (không đưa vào app). */
export function fakeKey(): Record<number, string> { const k: Record<number, string> = {}; for (const q of exam1.questions) k[q.questionNumber] = q.choices[0].label; return k }
