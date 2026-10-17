export type Section = 'listening' | 'reading'
export type QType = 'listen_tf_image'|'listen_pick_image'|'match_image_bank'|'listen_dialog_choice'|'read_tf_image'|'read_pick_image'|'read_match_answer'|'read_fill_bank'
export interface Choice { label: string; imageId?: string; hanzi?: string; pinyin?: string; text?: string }
export interface GroupInfo { id: number; roman: string; from: number; to: number; instruction: string }
/** Câu hỏi dùng trong UI: KHÔNG chứa đáp án. */
export interface Question { examId: number; questionNumber: number; section: Section; group: number; questionType: QType; hanzi: string; pinyin: string; imageIds: string[]; choices: Choice[]; sourceRef: string; audio: { start: number; end: number } | null; bankGroup?: number }
export interface Exam { examId: number; title: string; group: 'A'|'B'; lesson: string; groups: GroupInfo[]; questions: Question[] }
export type Answers = Record<number, string>
export interface AnswerKey { examId: number; answers: Answers; verified: boolean; source: 'import'|'manual'; updatedAt: number }
export type Mode = 'exam' | 'practice'
export interface Attempt { id?: number; examId: number; mode: Mode; answers: Answers; flags: number[]; hard: number[]; startedAt: number; finishedAt?: number; limitSec: number | null; remainingSec: number | null; status: 'in_progress'|'submitted'; result?: ScoreResult; current: number }
export interface GroupScore { group: number; correct: number; graded: number; total: number }
export interface ScoreResult { gradable: 'full'|'partial'|'none'; gradedCount: number; correct: number; listening: number|null; reading: number|null; total: number|null; pointsPerQuestion: number; perGroup: GroupScore[]; wrong: number[]; blank: number[]; ungraded: number[] }
export type AudioSegmentStatus = 'confirmed' | 'needsReview' | 'missing'
export interface AudioSegment { examId: number; questionNumber: number; start: number; end: number; status: AudioSegmentStatus; confirmed?: boolean }
