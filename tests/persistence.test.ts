import 'fake-indexeddb/auto'
import { describe, it, expect } from 'vitest'
import { db, setKey, getKey, exportBackup, importBackup, resetAll } from '../src/lib/db'
describe('lưu bền vững (IndexedDB)', () => {
  it('lưu & đọc answer key, attempt', async () => { await setKey(1, { 1: 'T' }, 'manual'); expect(await getKey(1)).toEqual({ 1: 'T' }); expect(await getKey(2)).toBeNull()
    const id = await db.attempts.add({ examId: 1, mode: 'exam', answers: { 1: 'T' }, flags: [], hard: [], startedAt: 1, limitSec: null, remainingSec: null, status: 'in_progress', current: 1 }); expect((await db.attempts.get(id))!.answers[1]).toBe('T') })
  it('backup → reset → import khôi phục', async () => { const b = await exportBackup(); await resetAll(); expect(await db.attempts.count()).toBe(0); await importBackup(JSON.parse(JSON.stringify(b))); expect(await db.attempts.count()).toBeGreaterThan(0) })
  it('từ chối backup sai định dạng', async () => { await expect(importBackup({ foo: 1 })).rejects.toThrow() })
})
