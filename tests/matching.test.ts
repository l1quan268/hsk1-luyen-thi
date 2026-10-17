import { describe, it, expect } from 'vitest'
import { assignAnswer, findDuplicates } from '../src/lib/answers'; import { parseAnswerFile } from '../src/lib/schema'; import { EXAMS } from '../src/lib/data'; import { exam1 } from './fixtures'
const q = (n: number) => exam1.questions[n - 1]
describe('ghép hình/câu — mỗi lựa chọn dùng một lần', () => {
  it('chọn nhãn đã dùng ở câu khác sẽ chuyển sang câu mới', () => { let a = assignAnswer(exam1, {}, q(11), 'B').answers; const r = assignAnswer(exam1, a, q(12), 'B'); expect(r.displaced).toBe(11); expect(r.answers[11]).toBeUndefined(); expect(r.answers[12]).toBe('B'); expect(findDuplicates(exam1, r.answers)).toEqual([]) })
  it('bấm lại để bỏ chọn', () => { const a = assignAnswer(exam1, { 11: 'A' }, q(11), 'A').answers; expect(a[11]).toBeUndefined() })
  it('nhóm 36–40 cho phép lặp từ', () => { const a = assignAnswer(exam1, { 36: 'C' }, q(37), 'C'); expect(a.displaced).toBeNull(); expect(a.answers[36]).toBe('C') })
  it('findDuplicates phát hiện trùng', () => { expect(findDuplicates(exam1, { 11: 'A', 12: 'A' })).toEqual([[11, 12]]) })
  it('file đáp án: từ chối nhãn sai và nhãn trùng ở nhóm ghép', () => { const { keys, issues } = parseAnswerFile({ exams: { 1: { 1: 'T', 6: 'D', 11: 'A', 12: 'A' } } }, EXAMS); expect(keys[1][1]).toBe('T'); expect(keys[1][6]).toBeUndefined(); expect(issues.map(i => i.message).join()).toMatch(/không thuộc/); expect(issues.map(i => i.message).join()).toMatch(/trùng/) })
})
