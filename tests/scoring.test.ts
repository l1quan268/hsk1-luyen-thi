import { describe, it, expect } from 'vitest'
import { scoreAttempt } from '../src/lib/scoring'; import { exam1, fakeKey } from './fixtures'
describe('chấm điểm', () => {
  it('không có answer key → none, không tính sai', () => { const r = scoreAttempt(exam1, { 1: 'T' }, null); expect(r.gradable).toBe('none'); expect(r.total).toBeNull(); expect(r.wrong).toEqual([]); expect(r.ungraded).toHaveLength(40) })
  it('đủ key, đúng hết = 200, nghe/đọc 100/100', () => { const k = fakeKey(); const r = scoreAttempt(exam1, k, k); expect(r.total).toBe(200); expect(r.listening).toBe(100); expect(r.reading).toBe(100) })
  it('phân loại sai / bỏ trống', () => { const k = fakeKey(); const a = { ...k }; delete a[3]; a[4] = 'ZZ'; const r = scoreAttempt(exam1, a, k); expect(r.blank).toEqual([3]); expect(r.wrong).toEqual([4]); expect(r.total).toBe(190) })
  it('key một phần → partial, total null', () => { const k = fakeKey(); for (let n = 21; n <= 40; n++) delete k[n]; const r = scoreAttempt(exam1, fakeKey(), k); expect(r.gradable).toBe('partial'); expect(r.listening).toBe(100); expect(r.reading).toBeNull(); expect(r.total).toBeNull() })
  it('điểm/câu cấu hình được', () => { const k = fakeKey(); expect(scoreAttempt(exam1, k, k, 2).total).toBe(80) })
})
