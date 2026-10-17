import s1 from '../data/solutions01.json'
import s2 from '../data/solutions02.json'
import s3 from '../data/solutions03.json'
import s4 from '../data/solutions04.json'
import s5 from '../data/solutions05.json'
import s6 from '../data/solutions06.json'

export interface SolutionItem {
  questionNumber: number
  section: 'listening' | 'reading'
  answer: string
  hanzi: string
  pinyin: string
  explanation: string
  dialogChoices?: string | null
  matchedAnswer?: { hanzi: string; pinyin: string } | null
  fillWord?: { hanzi: string; pinyin: string } | null
  completeSentence?: string | null
}

export interface ExamSolution {
  examId: number
  answers: Record<number, string>
  items: Record<number, SolutionItem>
}

const SOLUTIONS: Record<number, ExamSolution> = {
  1: s1 as unknown as ExamSolution,
  2: s2 as unknown as ExamSolution,
  3: s3 as unknown as ExamSolution,
  4: s4 as unknown as ExamSolution,
  5: s5 as unknown as ExamSolution,
  6: s6 as unknown as ExamSolution,
}

export function getExamSolution(examId: number): ExamSolution | undefined {
  return SOLUTIONS[examId]
}

export function getOfficialAnswers(examId: number): Record<number, string> | undefined {
  return SOLUTIONS[examId]?.answers
}

export function getQuestionSolution(examId: number, questionNumber: number): SolutionItem | undefined {
  return SOLUTIONS[examId]?.items?.[questionNumber]
}
