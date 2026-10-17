import { useState } from 'react'
import { CheckCircle2, XCircle, Volume2, Eye, EyeOff } from 'lucide-react'
import type { SolutionItem } from '../lib/solutions'

export function SolutionCard({
  item,
  userAnswer,
  compact,
  audioUrl,
}: {
  item: SolutionItem
  userAnswer?: string
  compact?: boolean
  audioUrl?: string
}) {
  const [showPinyin, setShowPinyin] = useState(true)
  const [showMeaning, setShowMeaning] = useState(true)

  const isCorrect = userAnswer != null && userAnswer !== '' && userAnswer === item.answer
  const isWrong = userAnswer != null && userAnswer !== '' && userAnswer !== item.answer
  const isBlank = !userAnswer

  const displayAns = (val?: string) => {
    if (val === 'T') return '✓ Đúng'
    if (val === 'F') return '✗ Sai'
    return val ?? '—'
  }

  return (
    <div className={`rounded-2xl border transition-all ${isCorrect ? 'border-emerald-300 bg-emerald-50/40' : isWrong ? 'border-rose-300 bg-rose-50/40' : 'border-jade-200 bg-jade-50/30'} p-4 sm:p-5 mt-4 text-left space-y-3`}>
      {/* Header status */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink/5 pb-2.5">
        <div className="flex items-center gap-2">
          {userAnswer ? (
            isCorrect ? (
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                <CheckCircle2 className="h-4 w-4" /> Đúng
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-rose-700 bg-rose-100 px-2.5 py-1 rounded-full">
                <XCircle className="h-4 w-4" /> Sai (Bạn chọn: {displayAns(userAnswer)})
              </span>
            )
          ) : (
            <span className="text-xs font-medium text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full">
              Chưa trả lời
            </span>
          )}
          <span className="text-sm font-bold text-jade-800">
            Đáp án đúng: <span className="text-emerald-700 font-extrabold text-base">{displayAns(item.answer)}</span>
          </span>
        </div>

        {/* Pinyin and Translation toggles */}
        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => setShowPinyin(p => !p)}
            className={`px-2 py-1 rounded-lg border flex items-center gap-1 ${showPinyin ? 'bg-white border-jade-300 text-jade-700 font-medium' : 'bg-transparent border-transparent text-ink/50'}`}
          >
            {showPinyin ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />} Pinyin
          </button>
          <button
            type="button"
            onClick={() => setShowMeaning(m => !m)}
            className={`px-2 py-1 rounded-lg border flex items-center gap-1 ${showMeaning ? 'bg-white border-jade-300 text-jade-700 font-medium' : 'bg-transparent border-transparent text-ink/50'}`}
          >
            {showMeaning ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />} Nghĩa Việt
          </button>
        </div>
      </div>

      {/* Main transcript / sentence */}
      <div className="space-y-1">
        <div className="text-xs uppercase tracking-wider text-ink/50 font-semibold">
          {item.section === 'listening' ? 'Lời thoại nghe (Transcript):' : 'Nội dung câu:'}
        </div>
        <div className="hanzi text-2xl font-medium text-ink leading-relaxed">
          {item.hanzi}
        </div>
        {showPinyin && item.pinyin && (
          <div className="pinyin text-base text-jade-700 leading-normal">
            {item.pinyin}
          </div>
        )}
      </div>

      {/* Dialog Choices for Q16-20 */}
      {item.dialogChoices && (
        <div className="text-sm text-ink/80 bg-white/70 p-2.5 rounded-xl border border-ink/5">
          <span className="font-semibold text-xs text-ink/60 uppercase block mb-1">Các lựa chọn:</span>
          <span className="hanzi">{item.dialogChoices}</span>
        </div>
      )}

      {/* Matched Answer for Q31-35 */}
      {item.matchedAnswer && (
        <div className="text-sm bg-white/80 p-3 rounded-xl border border-jade-200/60 space-y-1">
          <span className="text-xs font-semibold text-jade-700 uppercase block">Cặp câu trả lời đúng:</span>
          <div className="hanzi text-lg font-medium text-ink">
            {item.matchedAnswer.hanzi}
          </div>
          {showPinyin && item.matchedAnswer.pinyin && (
            <div className="pinyin text-sm text-jade-600">
              {item.matchedAnswer.pinyin}
            </div>
          )}
        </div>
      )}

      {/* Complete Sentence & Filled Word for Q36-40 */}
      {item.fillWord && (
        <div className="text-sm bg-white/80 p-3 rounded-xl border border-jade-200/60 space-y-2">
          <div>
            <span className="text-xs font-semibold text-jade-700 uppercase block">Từ cần điền:</span>
            <span className="hanzi text-lg font-bold text-emerald-700 mr-2">{item.fillWord.hanzi}</span>
            {showPinyin && <span className="pinyin text-sm text-jade-600 font-medium">({item.fillWord.pinyin})</span>}
          </div>
          {item.completeSentence && (
            <div className="pt-1 border-t border-ink/5">
              <span className="text-xs font-semibold text-ink/60 uppercase block mb-0.5">Câu hoàn chỉnh:</span>
              <div className="hanzi text-lg font-medium text-ink">
                {item.completeSentence}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Vietnamese Explanation / Translation */}
      {showMeaning && item.explanation && (
        <div className="text-sm bg-white/90 p-3 rounded-xl border border-jade-200 text-ink/90">
          <span className="text-xs font-semibold text-jade-800 uppercase block mb-0.5">Giải nghĩa tiếng Việt:</span>
          <p className="leading-relaxed">{item.explanation}</p>
        </div>
      )}
    </div>
  )
}
