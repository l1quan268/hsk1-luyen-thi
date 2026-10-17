import Dexie, { type Table } from 'dexie'
import type { Attempt, AnswerKey, Answers, AudioSegmentStatus } from '../types'
import type { ReviewItem } from './srs'
export interface AudioRec { examId: number; name: string; blob: Blob }
export interface SegRec { examId: number; segments: Record<number, { start: number; end: number; confirmed: boolean; status?: AudioSegmentStatus }> }
export interface VocabRec { id: string; hanzi: string; pinyin: string; meaning?: string; meaningSource?: 'teacher'; saved: boolean }
export interface Settings { showPinyin: boolean; timerMinutes: number; timerEnabled: boolean; allowPause: boolean; examAudio: 'full' | 'off'; pointsPerQuestion: number; autoplayAudio: boolean }
export const DEFAULT_SETTINGS: Settings = { showPinyin: true, timerMinutes: 40, timerEnabled: true, allowPause: true, examAudio: 'full', pointsPerQuestion: 5, autoplayAudio: true }
class HskDB extends Dexie {
  attempts!: Table<Attempt, number>; keys!: Table<AnswerKey, number>; audio!: Table<AudioRec, number>
  segments!: Table<SegRec, number>; vocab!: Table<VocabRec, string>; review!: Table<ReviewItem, string>; kv!: Table<{ k: string; v: any }, string>
  constructor(name = 'hsk1-luyen-thi') {
    super(name)
    this.version(1).stores({ attempts: '++id,examId,status,finishedAt', keys: 'examId', audio: 'examId', segments: 'examId', vocab: 'id', review: 'id,due', kv: 'k' })
  }
}
export const db = new HskDB()
export async function getSettings(): Promise<Settings> { return { ...DEFAULT_SETTINGS, ...((await db.kv.get('settings'))?.v ?? {}) } }
export const saveSettings = (s: Settings) => db.kv.put({ k: 'settings', v: s })
export async function getKey(examId: number): Promise<Answers | null> { const k = await db.keys.get(examId); return k ? k.answers : null }
export async function setKey(examId: number, answers: Answers, source: 'import' | 'manual') { await db.keys.put({ examId, answers, verified: true, source, updatedAt: Date.now() }) }
export async function exportBackup() {
  const audioMeta = (await db.audio.toArray()).map(a => ({ examId: a.examId, name: a.name })) // MP3 không đưa vào JSON
  return { app: 'hsk1-luyen-thi', version: 1, exportedAt: new Date().toISOString(), attempts: await db.attempts.toArray(), keys: await db.keys.toArray(), segments: await db.segments.toArray(), vocab: await db.vocab.toArray(), review: await db.review.toArray(), kv: await db.kv.toArray(), audioMeta }
}
export async function importBackup(b: any) {
  if (b?.app !== 'hsk1-luyen-thi') throw new Error('File không phải backup của ứng dụng này')
  await db.transaction('rw', [db.attempts, db.keys, db.segments, db.vocab, db.review, db.kv], async () => {
    await Promise.all([db.attempts.clear(), db.keys.clear(), db.segments.clear(), db.vocab.clear(), db.review.clear(), db.kv.clear()])
    await db.attempts.bulkAdd(b.attempts ?? []); await db.keys.bulkAdd(b.keys ?? []); await db.segments.bulkAdd(b.segments ?? [])
    await db.vocab.bulkAdd(b.vocab ?? []); await db.review.bulkAdd(b.review ?? []); await db.kv.bulkAdd(b.kv ?? [])
  })
}
export async function resetAll() { await Promise.all([db.attempts.clear(), db.review.clear(), db.vocab.clear()]) } // giữ đáp án, MP3, segment
