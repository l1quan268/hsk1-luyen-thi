export const STEPS_DAYS = [1, 3, 7]
export interface ReviewItem { id: string; examId: number; questionNumber: number; step: number; due: number; lastResult?: 'ok'|'fail' }
const DAY = 86400000
export function newReviewItem(examId: number, questionNumber: number, now = Date.now()): ReviewItem { return { id: `${examId}-${questionNumber}`, examId, questionNumber, step: 0, due: now + STEPS_DAYS[0] * DAY } }
/** Nhớ → lên bậc (1→3→7→14 ngày); quên → về 1 ngày. */
export function nextReview(it: ReviewItem, remembered: boolean, now = Date.now()): ReviewItem {
  if (!remembered) return { ...it, step: 0, due: now + STEPS_DAYS[0] * DAY, lastResult: 'fail' }
  const step = it.step + 1
  const days = step < STEPS_DAYS.length ? STEPS_DAYS[step] : 14
  return { ...it, step, due: now + days * DAY, lastResult: 'ok' }
}
export const isDue = (it: ReviewItem, now = Date.now()) => it.due <= now
