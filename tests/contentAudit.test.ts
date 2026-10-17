import 'fake-indexeddb/auto'
import { describe, it, expect } from 'vitest'
import assets from '../src/data/assets.json'
import { EXAMS, getExam, imageUrl } from '../src/lib/data'
import { getExamSolution, getOfficialAnswers, getQuestionSolution } from '../src/lib/solutions'
import { scoreAttempt } from '../src/lib/scoring'

describe('HSK 1 Content & Asset Audit Test Suite', () => {
  it('should contain exactly 6 exams with 40 questions each (240 total)', () => {
    expect(EXAMS.length).toBe(6)
    let totalQuestions = 0
    for (let eid = 1; eid <= 6; eid++) {
      const exam = getExam(eid)
      expect(exam).toBeDefined()
      expect(exam.questions.length).toBe(40)
      totalQuestions += exam.questions.length
      // Check question numbers 1 to 40
      exam.questions.forEach((q, idx) => {
        expect(q.questionNumber).toBe(idx + 1)
        expect(q.examId).toBe(eid)
      })
    }
    expect(totalQuestions).toBe(240)
  })

  it('should have all 45 asset files existing on disk with valid references', () => {
    expect(assets.length).toBe(45)
    const assetIdSet = new Set(assets.map(a => a.id))

    // Check all assets have valid properties
    for (const a of assets) {
      expect(a.id).toBeTruthy()
      expect(a.file).toMatch(/^assets\/img\d{2}\.png$/)
      expect(a.bytes).toBeGreaterThan(0)
      expect(a.sha256).toHaveLength(64)
      expect(imageUrl(a.id)).toContain(a.file)
    }

    // Check that every question in EXAMS references valid assets
    for (const exam of EXAMS) {
      for (const q of exam.questions) {
        for (const iid of q.imageIds || []) {
          expect(assetIdSet.has(iid)).toBe(true)
        }
        for (const c of q.choices || []) {
          if (c.imageId) {
            expect(assetIdSet.has(c.imageId)).toBe(true)
          }
        }
      }
    }
  })

  it('should have updated targeted assets for corrected questions', () => {
    // E01-Q04: should use img40 (thầy giáo nam)
    const e1q4 = getExam(1).questions.find(q => q.questionNumber === 4)!
    expect(e1q4.imageIds).toEqual(['img40'])

    // E01-Q23: should use img41 (đúng 1 quyển sách)
    const e1q23 = getExam(1).questions.find(q => q.questionNumber === 23)!
    expect(e1q23.imageIds).toEqual(['img41'])

    // E02-Q22: should use img42 (2 chú chó)
    const e2q22 = getExam(2).questions.find(q => q.questionNumber === 22)!
    expect(e2q22.imageIds).toEqual(['img42'])

    // E03-Q04: should use img42 (2 chú chó)
    const e3q4 = getExam(3).questions.find(q => q.questionNumber === 4)!
    expect(e3q4.imageIds).toEqual(['img42'])

    // E04-Q05: should use img43 (nữ bác sĩ)
    const e4q5 = getExam(4).questions.find(q => q.questionNumber === 5)!
    expect(e4q5.imageIds).toEqual(['img43'])

    // E04-Q09: choice B should use img42 (2 chú chó)
    const e4q9 = getExam(4).questions.find(q => q.questionNumber === 9)!
    const bChoice = e4q9.choices.find(c => c.label === 'B')
    expect(bChoice?.imageId).toBe('img42')

    // E05-Q06: choice A should use img40 (thầy giáo nam)
    const e5q6 = getExam(5).questions.find(q => q.questionNumber === 6)!
    const aChoice = e5q6.choices.find(c => c.label === 'A')
    expect(aChoice?.imageId).toBe('img40')

    // E05-Q21: should use img44 (lịch thứ Sáu FRI / 星期五)
    const e5q21 = getExam(5).questions.find(q => q.questionNumber === 21)!
    expect(e5q21.imageIds).toEqual(['img44'])

    // E05-Q23: should use img45 (bánh sinh nhật 8月17日)
    const e5q23 = getExam(5).questions.find(q => q.questionNumber === 23)!
    expect(e5q23.imageIds).toEqual(['img45'])

    // E06-Q06: choice A should use img45 (bánh sinh nhật 8月17日)
    const e6q6 = getExam(6).questions.find(q => q.questionNumber === 6)!
    const e6aChoice = e6q6.choices.find(c => c.label === 'A')
    expect(e6aChoice?.imageId).toBe('img45')
  })

  it('should preserve exam secrecy: EXAMS questions must NOT leak correctAnswer', () => {
    for (const exam of EXAMS) {
      for (const q of exam.questions) {
        expect((q as any).correctAnswer).toBeUndefined()
        expect((q as any).answerStatus).toBeUndefined()
      }
    }
  })

  it('should have complete solutions for all 240 questions and score 100% on perfect answers', () => {
    for (let eid = 1; eid <= 6; eid++) {
      const sol = getExamSolution(eid)
      expect(sol).toBeDefined()
      const answers = getOfficialAnswers(eid)
      expect(answers).toBeDefined()
      expect(Object.keys(answers!).length).toBe(40)

      for (let qn = 1; qn <= 40; qn++) {
        const item = getQuestionSolution(eid, qn)
        expect(item).toBeDefined()
        expect(item!.answer).toBeTruthy()
        expect(item!.hanzi).toBeTruthy()
        expect(item!.pinyin).toBeTruthy()
        expect(item!.explanation).toBeTruthy()
      }

      // Perfect score test
      const exam = getExam(eid)
      const result = scoreAttempt(exam, answers!, answers!)
      expect(result.correct).toBe(40)
      expect(result.total).toBe(200)
      expect(result.listening).toBe(100)
      expect(result.reading).toBe(100)
    }
  })

  it('should maintain 1-to-1 bijection in matching question sections', () => {
    for (let eid = 1; eid <= 6; eid++) {
      const answers = getOfficialAnswers(eid)!

      // Listening Match (11-15): answers must be permutation of A, B, C, D, E
      const listenMatch = [11, 12, 13, 14, 15].map(q => answers[q]).sort()
      expect(listenMatch).toEqual(['A', 'B', 'C', 'D', 'E'])

      // Reading Match (31-35): answers must be permutation of A, B, C, D, E
      const readMatch = [31, 32, 33, 34, 35].map(q => answers[q]).sort()
      expect(readMatch).toEqual(['A', 'B', 'C', 'D', 'E'])

      // Reading Fill-in (36-40): 5 distinct choices from A-F
      const fillChoices = [36, 37, 38, 39, 40].map(q => answers[q])
      const uniqueFill = new Set(fillChoices)
      expect(uniqueFill.size).toBe(5)
    }
  })
})
