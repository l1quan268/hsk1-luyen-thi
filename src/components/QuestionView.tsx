import { Check, X } from 'lucide-react'
import type { Question, Exam } from '../types'
import { imageUrl, hasImage } from '../lib/data'

export interface QProps { exam: Exam; q: Question; value?: string; onPick: (label: string) => void; showPinyin: boolean; revealKey?: string | null; usedLabels?: Map<string, number> }

function Img({ id, big }: { id: string; big?: boolean }) {
  if (!hasImage(id)) return <div className="grid place-items-center h-28 w-28 rounded-xl bg-amber-50 text-xs text-amber-700">Thiếu hình {id}</div>
  return <img src={imageUrl(id)} alt={`Hình ${id}`} className={`${big ? 'h-44 w-44' : 'h-28 w-28'} object-contain rounded-xl bg-white`} draggable={false} />
}
function Blank({ text }: { text: string }) { // hiển thị chỗ trống dạng gạch, giữ nguyên chữ còn lại
  return <>{text.split(/(?:_\s?)+_?/).map((part, i, a) => <span key={i}>{part}{i < a.length - 1 && <span className="inline-block w-14 border-b-2 border-jade-500 mx-1 align-baseline" />}</span>)}</>
}
export function Prompt({ q, showPinyin }: { q: Question; showPinyin: boolean }) {
  if (!q.hanzi) return null
  return <div className="mb-5"><p className="hanzi text-3xl leading-relaxed"><Blank text={q.hanzi} /></p>{showPinyin && q.pinyin && <p className="pinyin text-lg mt-1"><Blank text={q.pinyin} /></p>}</div>
}
function cardCls(selected: boolean, key?: string | null, label?: string) {
  const base = 'relative text-left rounded-2xl border-2 p-3 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 ring-jade-500 '
  if (key) { if (label === key) return base + 'border-emerald-500 bg-emerald-50'; if (selected) return base + 'border-rose-400 bg-rose-50' }
  return base + (selected ? 'border-jade-600 bg-jade-50 shadow-soft' : 'border-ink/10 bg-white hover:border-jade-400')
}
export function QuestionView({ exam, q, value, onPick, showPinyin, revealKey, usedLabels }: QProps) {
  const t = q.questionType
  return (
    <div data-testid={`q-${q.questionNumber}`}>
      {(t === 'listen_tf_image' || t === 'read_tf_image') && (<>
        <div className="flex justify-center mb-4">{q.imageIds.map(id => <Img key={id} id={id} big />)}</div>
        <Prompt q={q} showPinyin={showPinyin} />
        <div className="grid grid-cols-2 gap-3">
          {q.choices.map(c => <button key={c.label} onClick={() => onPick(c.label)} aria-pressed={value === c.label} className={cardCls(value === c.label, revealKey, c.label) + ' flex items-center justify-center gap-2 text-lg font-medium'}>
            {c.label === 'T' ? <Check className="h-5 w-5" /> : <X className="h-5 w-5" />}{c.text}</button>)}
        </div></>)}
      {(t === 'listen_pick_image' || t === 'read_pick_image') && (<>
        <Prompt q={q} showPinyin={showPinyin} />
        <div className="grid grid-cols-3 gap-3">
          {q.choices.map(c => <button key={c.label} onClick={() => onPick(c.label)} aria-pressed={value === c.label} className={cardCls(value === c.label, revealKey, c.label) + ' flex flex-col items-center gap-2'}>
            <Img id={c.imageId!} big /><span className="font-bold text-lg">{c.label}</span></button>)}
        </div></>)}
      {t === 'match_image_bank' && (<>
        <p className="mb-3 text-sm opacity-70">Chọn một hình A–E cho câu {q.questionNumber}. Mỗi hình chỉ dùng một lần (chọn hình đã dùng sẽ chuyển sang câu này).</p>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {q.choices.map(c => { const used = usedLabels?.get(c.label); return <button key={c.label} onClick={() => onPick(c.label)} aria-pressed={value === c.label} className={cardCls(value === c.label, revealKey, c.label) + ' flex flex-col items-center gap-1'}>
            <Img id={c.imageId!} /><span className="font-bold">{c.label}</span>{used && used !== q.questionNumber && <span className="text-xs text-amber-700">đang dùng ở câu {used}</span>}</button> })}
        </div></>)}
      {t === 'listen_dialog_choice' && (<div className="grid gap-3">
        {q.choices.map(c => <button key={c.label} onClick={() => onPick(c.label)} aria-pressed={value === c.label} className={cardCls(value === c.label, revealKey, c.label) + ' flex items-baseline gap-4'}>
          <span className="font-bold text-lg w-6">{c.label}</span><span><span className="hanzi text-2xl block">{c.hanzi}</span>{showPinyin && <span className="pinyin">{c.pinyin}</span>}</span></button>)}</div>)}
      {(t === 'read_match_answer' || t === 'read_fill_bank') && (<>
        <Prompt q={q} showPinyin={showPinyin} />
        <div className={`grid gap-3 ${t === 'read_fill_bank' ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-1'}`}>
          {q.choices.map(c => { const used = usedLabels?.get(c.label); return <button key={c.label} onClick={() => onPick(c.label)} aria-pressed={value === c.label} className={cardCls(value === c.label, revealKey, c.label) + ' flex items-baseline gap-3'}>
            <span className="font-bold">{c.label}</span><span><span className="hanzi text-xl block">{c.hanzi}</span>{showPinyin && <span className="pinyin text-sm">{c.pinyin}</span>}</span>
            {used && used !== q.questionNumber && <span className="ml-auto text-xs text-amber-700">câu {used}</span>}</button> })}
        </div></>)}
    </div>
  )
}
