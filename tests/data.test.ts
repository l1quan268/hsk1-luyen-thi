import { describe, it, expect } from 'vitest'
import { EXAMS } from '../src/lib/data'; import { validateExam } from '../src/lib/schema'
import assets from '../src/data/assets.json'
describe('dữ liệu trích xuất từ Word', () => {
  it('có 6 đề × 40 câu, 20 nghe + 20 đọc', () => { expect(EXAMS).toHaveLength(6); for (const e of EXAMS) { expect(e.questions).toHaveLength(40); expect(e.questions.filter(q => q.section === 'listening')).toHaveLength(20); expect(e.groups).toHaveLength(8) } })
  it('schema hợp lệ cho mọi đề', () => { for (const e of EXAMS) expect(validateExam(e)).toEqual([]) })
  it('mọi imageId tham chiếu đến ảnh có thật', () => { const ids = new Set((assets as any[]).map(a => a.id)); for (const e of EXAMS) for (const q of e.questions) for (const id of [...q.imageIds, ...q.choices.map(c => c.imageId).filter(Boolean) as string[]]) expect(ids.has(id)).toBe(true) })
  it('dữ liệu UI không chứa đáp án', () => { for (const e of EXAMS) for (const q of e.questions) { expect('correctAnswer' in q).toBe(false); expect('answerStatus' in q).toBe(false) } })
  it('schema phát hiện lỗi', () => { expect(validateExam({ examId: 1, questions: [] }).length).toBeGreaterThan(0); expect(validateExam(null).length).toBe(1) })
})
