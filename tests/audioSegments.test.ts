import 'fake-indexeddb/auto'
import { describe, it, expect } from 'vitest'
import { getDefaultSegments, getExamSegments, getAllSegmentStats, exportAllSegmentsJson, importSegmentsJson, saveExamSegments } from '../src/lib/audioSegments'
import defaultSegments from '../src/data/default_audio_segments.json'

describe('Audio Segments & Smart Listening Tests', () => {
  it('dữ liệu default_audio_segments.json có đủ 6 đề, mỗi đề 20 câu', () => {
    const raw = defaultSegments as Record<string, Record<string, any>>
    for (let eid = 1; eid <= 6; eid++) {
      const ex = raw[String(eid)]
      expect(ex).toBeDefined()
      expect(Object.keys(ex)).toHaveLength(20)
    }
  })

  it('mọi câu trong 120 câu đều có start < end, không âm và không chồng lấn', () => {
    for (let eid = 1; eid <= 6; eid++) {
      const segs = getDefaultSegments(eid)
      expect(Object.keys(segs)).toHaveLength(20)

      for (let qn = 1; qn <= 20; qn++) {
        const s = segs[qn]
        expect(s).toBeDefined()
        expect(s.examId).toBe(eid)
        expect(s.questionNumber).toBe(qn)
        expect(s.start).toBeGreaterThanOrEqual(0)
        expect(s.end).toBeGreaterThan(s.start)
        expect(s.status).toBe('confirmed')
        expect(s.confirmed).toBe(true)

        // No overlap with previous question
        if (qn > 1) {
          const prev = segs[qn - 1]
          expect(s.start).toBeGreaterThanOrEqual(prev.end - 0.1)
        }
      }
    }
  })

  it('thống kê ban đầu có đủ 120 câu confirmed', async () => {
    const stats = await getAllSegmentStats()
    expect(stats.total).toBe(120)
    expect(stats.confirmed).toBe(120)
    expect(stats.needsReview).toBe(0)
    expect(stats.missing).toBe(0)
  })

  it('lưu & sửa trạng thái câu trong IndexedDB', async () => {
    const orig = await getExamSegments(1)
    const updated = {
      ...orig,
      5: {
        ...orig[5],
        status: 'needsReview' as const,
        confirmed: false
      }
    }
    await saveExamSegments(1, updated)

    const fromDb = await getExamSegments(1)
    expect(fromDb[5].status).toBe('needsReview')
    expect(fromDb[5].confirmed).toBe(false)

    // Check stats updated
    const stats = await getAllSegmentStats()
    expect(stats.confirmed).toBe(119)
    expect(stats.needsReview).toBe(1)
  })

  it('xuất và nhập file JSON timestamp thành công', async () => {
    const exported = await exportAllSegmentsJson()
    expect(Object.keys(exported)).toHaveLength(6)
    expect(Object.keys(exported[1])).toHaveLength(20)

    const count = await importSegmentsJson(exported)
    expect(count).toBe(120)
  })
})
