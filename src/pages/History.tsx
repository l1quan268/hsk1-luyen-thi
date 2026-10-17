import { useEffect, useState } from 'react'
import { db } from '../lib/db'; import type { Attempt } from '../types'; import { fmtDate, pad } from '../components/ui'; import type { View } from '../App'
export default function History({ go }: { go: (v: View) => void }) {
  const [list, setList] = useState<Attempt[]>([])
  useEffect(() => { db.attempts.where('status').equals('submitted').toArray().then(l => setList(l.sort((a, b) => (a.finishedAt ?? 0) - (b.finishedAt ?? 0)))) }, [])
  const pts = list.filter(a => a.result?.total != null); const W = 560, H = 160
  const x = (i: number) => 30 + (pts.length < 2 ? 0 : i * (W - 50) / (pts.length - 1)); const y = (v: number) => H - 20 - v / 200 * (H - 40)
  return (<div><h1 className="text-2xl font-bold mb-4">Lịch sử làm bài</h1>
    <div className="card p-4 mb-5"><h2 className="font-semibold mb-2">Tiến bộ (điểm /200, chỉ các bài chấm đủ 40 câu)</h2>
      {pts.length === 0 ? <p className="text-sm opacity-70">Chưa có bài nào được chấm đầy đủ. Cần answer key xác thực.</p> :
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Biểu đồ điểm theo thời gian"><line x1="30" y1={y(0)} x2={W - 10} y2={y(0)} stroke="#ccc" /><line x1="30" y1={y(200)} x2={W - 10} y2={y(200)} stroke="#eee" />
          <polyline fill="none" stroke="#1F8A7E" strokeWidth="2" points={pts.map((a, i) => `${x(i)},${y(a.result!.total!)}`).join(' ')} />
          {pts.map((a, i) => <g key={a.id}><circle cx={x(i)} cy={y(a.result!.total!)} r="4" fill="#186D6A" /><text x={x(i)} y={y(a.result!.total!) - 8} fontSize="10" textAnchor="middle">{a.result!.total}</text></g>)}</svg>}</div>
    <div className="card divide-y divide-ink/5">{list.slice().reverse().map(a => <button key={a.id} onClick={() => go({ name: 'result', attemptId: a.id! })} className="w-full text-left p-3 flex justify-between hover:bg-cream"><span>Đề {pad(a.examId)} · {a.mode === 'exam' ? 'Thi thử' : 'Luyện tập'}</span><span className="opacity-70">{fmtDate(a.finishedAt)} · {a.result?.total != null ? `${a.result.total}/200` : 'chưa chấm được'}</span></button>)}
      {list.length === 0 && <p className="p-4 text-sm opacity-70">Chưa có bài nộp nào.</p>}</div></div>)
}
