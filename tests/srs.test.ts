import { describe, it, expect } from 'vitest'
import { newReviewItem, nextReview, isDue } from '../src/lib/srs'
const D = 86400000
describe('spaced repetition 1/3/7', () => {
  it('lịch 1 → 3 → 7 → 14, quên thì về 1 ngày', () => { const t = 1_000_000; let it = newReviewItem(1, 5, t); expect(it.due - t).toBe(D); it = nextReview(it, true, t); expect(it.due - t).toBe(3 * D); it = nextReview(it, true, t); expect(it.due - t).toBe(7 * D); it = nextReview(it, true, t); expect(it.due - t).toBe(14 * D); it = nextReview(it, false, t); expect(it.step).toBe(0); expect(it.due - t).toBe(D) })
  it('isDue', () => { const it = newReviewItem(1, 5, 0); expect(isDue(it, D - 1)).toBe(false); expect(isDue(it, D)).toBe(true) })
})
