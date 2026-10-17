import { useEffect, useState } from 'react'
import { Play, Clock, Trophy, CheckCircle2, FileQuestion } from 'lucide-react'
import { EXAMS } from '../lib/data'; import { db } from '../lib/db'; import type { Attempt, Mode } from '../types'
import { Modal, fmtDate, pad } from '../components/ui'; import type { View } from '../App'
export default function Home({ go, compact }: { go: (v: View) => void; compact?: boolean }) {
  const [attempts, setAttempts] = useState<Attempt[]>([]); const [keys, setKeys] = useState<Set<number>>(new Set()); const [pick, setPick] = useState<number | null>(null)
  useEffect(() => { db.attempts.toArray().then(setAttempts); db.keys.toArray().then(k => setKeys(new Set(k.map(x => x.examId)))) }, [])
  const info = (id: number) => { const a = attempts.filter(x => x.examId === id); const prog = a.find(x => x.status === 'in_progress'); const last = a.filter(x => x.status === 'submitted').sort((p, q) => (q.finishedAt ?? 0) - (p.finishedAt ?? 0))[0]
    return { prog, last, answered: prog ? Object.keys(prog.answers).length : 0 } }
  const start = (mode: Mode) => { go({ name: 'exam', examId: pick!, mode }) }
  return (<div>
    <h1 className="text-2xl font-bold mb-1">{compact ? 'Tổng quan' : 'Luyện đề HSK 1'}</h1>
    <p className="text-sm opacity-70 mb-6">6 đề × 40 câu (20 nghe + 20 đọc). Đề luyện theo cấu trúc HSK 1 truyền thống, không phải đề thi chính thức.</p>
    {(['A', 'B'] as const).map(g => <section key={g} className="mb-8">
      <h2 className="font-semibold mb-3">Nhóm {g} · {g === 'A' ? 'Bài 9–10 MUSAN (Đề 01–03)' : 'Tổng ôn Bài 6–10 MUSAN (Đề 04–06)'}</h2>
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {EXAMS.filter(e => e.group === g).map(e => { const i = info(e.examId); const pct = Math.round(i.answered / 40 * 100)
          return <div key={e.examId} className="card p-5">
            <div className="flex justify-between items-start"><div><div className="text-xs opacity-60">{e.lesson}</div><div className="text-xl font-bold">Đề {pad(e.examId)}</div></div>
              {!keys.has(e.examId) && <span className="text-xs bg-amber-50 text-amber-700 rounded-lg px-2 py-1 flex items-center gap-1" title="Chưa có đáp án xác thực"><FileQuestion className="h-3 w-3" />chưa có đáp án</span>}</div>
            <div className="mt-4 h-2 rounded bg-jade-50"><div className="h-2 rounded bg-jade-500" style={{ width: `${pct}%` }} /></div>
            <div className="mt-1 text-xs opacity-70">Tiến độ đang làm: {i.answered}/40</div>
            <div className="mt-3 text-sm space-y-1"><div className="flex gap-2 items-center"><Clock className="h-4 w-4" />Gần nhất: {fmtDate(i.last?.finishedAt)}</div>
              <div className="flex gap-2 items-center"><Trophy className="h-4 w-4" />Điểm gần nhất: {i.last?.result?.total != null ? `${i.last.result.total}/200` : i.last ? 'chưa chấm được' : '—'}</div></div>
            <button className="btn-primary mt-4 w-full justify-center" onClick={() => setPick(e.examId)}>{i.prog ? <><CheckCircle2 className="h-4 w-4" />Tiếp tục</> : <><Play className="h-4 w-4" />Bắt đầu</>}</button>
          </div> })}
      </div></section>)}
    {pick && <Modal title={`Đề ${pad(pick)} — chọn chế độ`} onClose={() => setPick(null)}>
      <button className="card w-full p-4 text-left hover:border-jade-400" onClick={() => start('exam')}><b>Thi thử</b><br />Đúng thứ tự, có đồng hồ, không hiện đáp án/lời giải. Chấm sau khi nộp.</button>
      <button className="card w-full p-4 text-left hover:border-jade-400" onClick={() => start('practice')}><b>Luyện tập</b><br />Không giới hạn thời gian, ẩn/hiện Pinyin, xem đáp án khi đã có answer key.</button>
      {info(pick).prog && <p className="text-xs opacity-70">Bài đang làm dở cùng chế độ sẽ được tiếp tục.</p>}</Modal>}
  </div>)
}
