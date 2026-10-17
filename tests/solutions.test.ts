import { describe, it, expect } from 'vitest'
import { getExamSolution, getOfficialAnswers, getQuestionSolution } from '../src/lib/solutions'
import { EXAMS } from '../src/lib/data'
import { scoreAttempt } from '../src/lib/scoring'

describe('HSK 1 Solutions and Transcripts Audit', () => {
  it('đủ 6 đề thi, mỗi đề có đủ 40 câu đáp án và lời giải', () => {
    for (let eid = 1; eid <= 6; eid++) {
      const sol = getExamSolution(eid)
      expect(sol).toBeDefined()
      expect(sol?.examId).toBe(eid)
      expect(Object.keys(sol!.answers)).toHaveLength(40)
      expect(Object.keys(sol!.items)).toHaveLength(40)
    }
  })

  it('toàn bộ 240 đáp án hợp lệ theo cấu trúc từng câu trong EXAMS', () => {
    for (const ex of EXAMS) {
      const answers = getOfficialAnswers(ex.examId)!
      expect(answers).toBeDefined()
      for (const q of ex.questions) {
        const ans = answers[q.questionNumber]
        expect(ans).toBeDefined()
        const validChoices = q.choices.map(c => c.label)
        expect(validChoices).toContain(ans)
      }
    }
  })

  it('120 câu nghe (1–20) có đầy đủ chữ Hán, Pinyin và nghĩa Việt', () => {
    for (let eid = 1; eid <= 6; eid++) {
      for (let qn = 1; qn <= 20; qn++) {
        const item = getQuestionSolution(eid, qn)!
        expect(item).toBeDefined()
        expect(item.section).toBe('listening')
        expect(item.hanzi.trim().length).toBeGreaterThan(0)
        expect(item.pinyin.trim().length).toBeGreaterThan(0)
        expect(item.explanation.trim().length).toBeGreaterThan(0)
        if (qn >= 16) {
          expect(item.dialogChoices).toBeTruthy()
        }
      }
    }
  })

  it('120 câu đọc (21–40) có đầy đủ câu gốc/nối/điền từ và giải nghĩa', () => {
    for (let eid = 1; eid <= 6; eid++) {
      for (let qn = 21; qn <= 40; qn++) {
        const item = getQuestionSolution(eid, qn)!
        expect(item).toBeDefined()
        expect(item.section).toBe('reading')
        expect(item.hanzi.trim().length).toBeGreaterThan(0)
        expect(item.pinyin.trim().length).toBeGreaterThan(0)
        expect(item.explanation.trim().length).toBeGreaterThan(0)

        // Nhóm nối 31–35
        if (qn >= 31 && qn <= 35) {
          expect(item.matchedAnswer).toBeDefined()
          expect(item.matchedAnswer?.hanzi.length).toBeGreaterThan(0)
          expect(item.matchedAnswer?.pinyin.length).toBeGreaterThan(0)
        }

        // Nhóm điền từ 36–40
        if (qn >= 36 && qn <= 40) {
          expect(item.fillWord).toBeDefined()
          expect(item.fillWord?.hanzi.length).toBeGreaterThan(0)
          expect(item.fillWord?.pinyin.length).toBeGreaterThan(0)
          expect(item.completeSentence).toBeTruthy()
        }
      }
    }
  })

  it('kiểm tra chi tiết Đề 01 câu 1, 16, 21, 31, 36 theo yêu cầu', () => {
    // Câu 1
    const q1 = getQuestionSolution(1, 1)!
    expect(q1.answer).toBe('F')
    expect(q1.hanzi).toBe('我喜欢看中国电影。')
    expect(q1.pinyin).toBe('wǒ xǐhuan kàn Zhōngguó diànyǐng.')
    expect(q1.explanation).toContain('phim Trung Quốc')

    // Câu 16
    const q16 = getQuestionSolution(1, 16)!
    expect(q16.answer).toBe('A')
    expect(q16.hanzi).toContain('你喜欢中国电影还是美国电影？')
    expect(q16.pinyin).toContain('Zhōngguó diànyǐng')
    expect(q16.dialogChoices).toContain('中国电影')

    // Câu 21
    const q21 = getQuestionSolution(1, 21)!
    expect(q21.answer).toBe('T')
    expect(q21.hanzi).toBe('我哥哥喜欢听音乐。')
    expect(q21.pinyin).toBe('wǒ gēge xǐhuan tīng yīnyuè.')
    expect(q21.explanation).toContain('nghe nhạc')

    // Câu 31
    const q31 = getQuestionSolution(1, 31)!
    expect(q31.answer).toBe('E')
    expect(q31.hanzi).toBe('你喜欢看什么电影？')
    expect(q31.matchedAnswer?.hanzi).toBe('我喜欢看中国电影。')

    // Câu 36
    const q36 = getQuestionSolution(1, 36)!
    expect(q36.answer).toBe('C')
    expect(q36.fillWord?.hanzi).toBe('喜欢')
    expect(q36.completeSentence).toContain('喜欢')
  })

  it('chấm điểm trọn vẹn 200 điểm khi làm đúng hết với đáp án chính thức', () => {
    const ex1 = EXAMS[0]
    const key = getOfficialAnswers(1)!
    const res = scoreAttempt(ex1, key, key)
    expect(res.gradable).toBe('full')
    expect(res.total).toBe(200)
    expect(res.listening).toBe(100)
    expect(res.reading).toBe(100)
    expect(res.correct).toBe(40)
    expect(res.wrong).toHaveLength(0)
    expect(res.blank).toHaveLength(0)
  })
})
