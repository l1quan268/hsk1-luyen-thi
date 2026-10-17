import { useEffect, useMemo, useState } from 'react'
import { EXAMS } from '../lib/data'; import { db, type VocabRec } from '../lib/db'
export default function Vocab() {
  const [saved, setSaved] = useState<Record<string, VocabRec>>({}); const [i, setI] = useState(0); const [step, setStep] = useState(0)
  const reload = () => db.vocab.toArray().then(l => setSaved(Object.fromEntries(l.map(v => [v.id, v]))))
  useEffect(() => { reload() }, [])
  const all = useMemo(() => { const m = new Map<string, VocabRec>(); for (const e of EXAMS) for (const q of e.questions) if (q.questionType === 'read_fill_bank' || q.questionType === 'listen_dialog_choice' || q.questionType === 'read_match_answer')
    for (const c of q.choices) if (c.hanzi && c.hanzi.length <= 8 && !m.has(c.hanzi)) m.set(c.hanzi, { id: c.hanzi, hanzi: c.hanzi, pinyin: c.pinyin ?? '', saved: false }); return [...m.values()] }, [])
  const cards = all.map(v => ({ ...v, ...saved[v.id] })); const c = cards[i % Math.max(1, cards.length)]
  const setMeaning = async (m: string) => { await db.vocab.put({ ...c, meaning: m || undefined, meaningSource: m ? 'teacher' : undefined }); reload() }
  return (<div className="max-w-xl"><h1 className="text-2xl font-bold mb-1">Từ vựng</h1><p className="text-sm opacity-70 mb-4">{cards.length} mục trích từ đề (Hán tự + Pinyin nguyên văn). Nghĩa Việt chỉ hiện khi giáo viên/bạn nhập vào.</p>
    {c && <div className="card p-8 text-center cursor-pointer select-none" onClick={() => setStep(s => (s + 1) % 3)} role="button" aria-label="Lật thẻ">
      <div className="hanzi text-6xl">{c.hanzi}</div>{step >= 1 && <div className="pinyin text-2xl mt-3">{c.pinyin}</div>}
      {step >= 2 && <div className="mt-3 text-lg">{c.meaning ? <>{c.meaning} <span className="text-xs opacity-60">(giáo viên bổ sung)</span></> : <span className="opacity-60 text-sm">Chưa có nghĩa Việt được duyệt</span>}</div>}
      <div className="text-xs opacity-50 mt-4">Bấm để lật: Hán tự → Pinyin → nghĩa</div></div>}
    {c && <div className="flex gap-2 mt-3 items-center"><button className="btn-ghost" onClick={() => { setI((i - 1 + cards.length) % cards.length); setStep(0) }}>Trước</button><button className="btn-primary" onClick={() => { setI(i + 1); setStep(0) }}>Sau</button>
      <input className="flex-1 rounded-xl border border-ink/10 px-3 py-2" placeholder="Nhập nghĩa Việt (giáo viên bổ sung)" defaultValue={c.meaning ?? ''} key={c.id} onBlur={e => setMeaning(e.target.value.trim())} /></div>}</div>)
}
