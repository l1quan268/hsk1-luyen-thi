import { describe, it, expect } from 'vitest'
import { renderToString } from 'react-dom/server'; import { createElement } from 'react'
import { QuestionView } from '../src/components/QuestionView'; import { exam1 } from './fixtures'
const render = (n: number, extra: any = {}) => renderToString(createElement(QuestionView, { exam: exam1, q: exam1.questions[n - 1], onPick: () => {}, showPinyin: true, ...extra }))
describe('question renderer', () => {
  it('đúng/sai có hình + 2 nút', () => { const h = render(1); expect(h).toContain('<img'); expect(h).toContain('Đúng'); expect(h).toContain('Sai') })
  it('chọn hình A/B/C có 3 ảnh', () => { expect((render(6).match(/<img/g) ?? []).length).toBe(3) })
  it('ghép hình A–E có 5 ảnh', () => { expect((render(11).match(/<img/g) ?? []).length).toBe(5) })
  it('hội thoại hiện Hán tự + Pinyin, ẩn Pinyin khi tắt', () => { expect(render(16)).toContain('中国电影'); expect(render(16)).toContain('Zhōngguó'); expect(render(16, { showPinyin: false })).not.toContain('Zhōngguó') })
  it('câu đọc hiện Hán tự gốc', () => { expect(render(21)).toContain('我哥哥喜欢听音乐') })
  it('điền từ có ngân hàng 6 từ', () => { const h = render(36); expect(h).toContain('照片'); expect(h).toContain('岁') })
  it('trạng thái chọn được đánh dấu aria-pressed', () => { expect(render(1, { value: 'T' })).toContain('aria-pressed="true"') })
  it('lộ đáp án chỉ khi truyền revealKey', () => { expect(render(1)).not.toContain('border-emerald-500'); expect(render(1, { revealKey: 'T' })).toContain('border-emerald-500') })
})
