import defaultSegmentsData from '../data/default_audio_segments.json'
import { db, type SegRec } from './db'
import type { AudioSegment, AudioSegmentStatus } from '../types'

const rawDefaults = defaultSegmentsData as unknown as Record<string, Record<string, AudioSegment>>

export function getDefaultSegments(examId: number): Record<number, AudioSegment> {
  const ex = rawDefaults[String(examId)]
  if (!ex) return {}
  const res: Record<number, AudioSegment> = {}
  for (const [qn, item] of Object.entries(ex)) {
    res[Number(qn)] = {
      ...item,
      confirmed: item.status === 'confirmed' || item.confirmed === true,
      status: item.status ?? (item.confirmed ? 'confirmed' : 'needsReview')
    }
  }
  return res
}

export async function getExamSegments(examId: number): Promise<Record<number, AudioSegment>> {
  const fromDb = await db.segments.get(examId)
  const defaults = getDefaultSegments(examId)

  if (!fromDb || !fromDb.segments || Object.keys(fromDb.segments).length === 0) {
    return defaults
  }

  // Merge DB customizations with defaults (DB overrides default)
  const merged: Record<number, AudioSegment> = { ...defaults }
  for (const [qnStr, s] of Object.entries(fromDb.segments)) {
    const qn = Number(qnStr)
    const status: AudioSegmentStatus = s.status ?? (s.confirmed ? 'confirmed' : 'needsReview')
    merged[qn] = {
      examId,
      questionNumber: qn,
      start: s.start,
      end: s.end,
      status,
      confirmed: status === 'confirmed'
    }
  }
  return merged
}

export async function saveExamSegments(examId: number, segments: Record<number, AudioSegment>): Promise<void> {
  const dbRecord: SegRec = {
    examId,
    segments: Object.fromEntries(
      Object.entries(segments).map(([qn, s]) => [
        Number(qn),
        {
          start: s.start,
          end: s.end,
          status: s.status,
          confirmed: s.status === 'confirmed'
        }
      ])
    )
  }
  await db.segments.put(dbRecord)
}

export async function getAllSegmentStats(): Promise<{ confirmed: number; needsReview: number; missing: number; total: number }> {
  let confirmed = 0
  let needsReview = 0
  let missing = 0

  for (let eid = 1; eid <= 6; eid++) {
    const segs = await getExamSegments(eid)
    for (let qn = 1; qn <= 20; qn++) {
      const s = segs[qn]
      if (!s || s.status === 'missing' || !(s.end > s.start)) {
        missing++
      } else if (s.status === 'confirmed' || s.confirmed) {
        confirmed++
      } else {
        needsReview++
      }
    }
  }

  return { confirmed, needsReview, missing, total: 120 }
}

export async function exportAllSegmentsJson(): Promise<Record<number, Record<number, AudioSegment>>> {
  const res: Record<number, Record<number, AudioSegment>> = {}
  for (let eid = 1; eid <= 6; eid++) {
    res[eid] = await getExamSegments(eid)
  }
  return res
}

export async function importSegmentsJson(data: any): Promise<number> {
  let count = 0
  if (!data || typeof data !== 'object') throw new Error('Dữ liệu JSON không hợp lệ')

  for (let eid = 1; eid <= 6; eid++) {
    const exData = data[eid] || data[String(eid)]
    if (exData && typeof exData === 'object') {
      const segs: Record<number, AudioSegment> = {}
      for (const [qnStr, s] of Object.entries(exData as Record<string, any>)) {
        const qn = Number(qnStr)
        if (qn >= 1 && qn <= 20) {
          const start = Number(s.start) || 0
          const end = Number(s.end) || 0
          const status: AudioSegmentStatus = s.status === 'confirmed' || s.confirmed ? 'confirmed' : s.status === 'missing' ? 'missing' : 'needsReview'
          segs[qn] = {
            examId: eid,
            questionNumber: qn,
            start,
            end,
            status,
            confirmed: status === 'confirmed'
          }
          count++
        }
      }
      if (Object.keys(segs).length > 0) {
        await saveExamSegments(eid, segs)
      }
    }
  }
  return count
}
