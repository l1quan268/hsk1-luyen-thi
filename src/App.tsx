import { useState } from 'react'
import { BookOpen, Home as HomeIcon, RotateCcw, Languages, History as Hist, Settings as Cog, ShieldCheck, Menu } from 'lucide-react'
import { ToastProvider } from './components/ui'
import Home from './pages/Home'; import ExamRunner from './pages/ExamRunner'; import Result from './pages/Result'
import History from './pages/History'; import Review from './pages/Review'; import Vocab from './pages/Vocab'; import SettingsPage from './pages/SettingsPage'; import Admin from './pages/Admin'
import type { Mode } from './types'
export type View = { name: 'home' } | { name: 'exams' } | { name: 'exam'; examId: number; mode: Mode } | { name: 'result'; attemptId: number } | { name: 'review' } | { name: 'vocab' } | { name: 'history' } | { name: 'settings' } | { name: 'admin' }
const NAV = [['home', 'Tổng quan', HomeIcon], ['exams', 'Luyện đề', BookOpen], ['review', 'Ôn câu sai', RotateCcw], ['vocab', 'Từ vựng', Languages], ['history', 'Lịch sử', Hist], ['settings', 'Cài đặt', Cog], ['admin', 'Quản trị', ShieldCheck]] as const
export default function App() {
  const [view, setView] = useState<View>({ name: 'home' }); const [open, setOpen] = useState(false)
  const go = (v: View) => { setView(v); setOpen(false) }
  const inExam = view.name === 'exam'
  return (
    <ToastProvider>
      <div className="min-h-screen lg:flex">
        {!inExam && <>
          <button className="lg:hidden fixed top-3 left-3 z-30 btn-ghost !p-2" aria-label="Menu" onClick={() => setOpen(o => !o)}><Menu className="h-5 w-5" /></button>
          <aside className={`${open ? 'block' : 'hidden'} lg:block fixed lg:sticky top-0 z-20 h-screen w-60 shrink-0 bg-white border-r border-ink/5 p-4`}>
            <div className="mb-6 pt-10 lg:pt-0"><div className="hanzi text-3xl font-bold text-jade-600">汉语 HSK 1</div><div className="text-xs opacity-60">Luyện thi · chạy cục bộ</div></div>
            <nav className="space-y-1">{NAV.map(([k, label, Icon]) => <button key={k} onClick={() => go({ name: k } as View)} className={`w-full flex items-center gap-3 rounded-xl px-3 py-2 text-left ${view.name === k || (k === 'exams' && view.name === 'result') ? 'bg-jade-50 text-jade-700 font-semibold' : 'hover:bg-cream'}`}><Icon className="h-5 w-5" />{label}</button>)}</nav>
          </aside></>}
        <main className="flex-1 p-4 sm:p-8 max-w-6xl mx-auto w-full">
          {view.name === 'home' && <Home go={go} compact />}
          {view.name === 'exams' && <Home go={go} />}
          {view.name === 'exam' && <ExamRunner key={`${view.examId}-${view.mode}`} examId={view.examId} mode={view.mode} onExit={() => go({ name: 'exams' })} onFinish={id => go({ name: 'result', attemptId: id })} />}
          {view.name === 'result' && <Result attemptId={view.attemptId} go={go} />}
          {view.name === 'review' && <Review />}{view.name === 'vocab' && <Vocab />}{view.name === 'history' && <History go={go} />}
          {view.name === 'settings' && <SettingsPage />}{view.name === 'admin' && <Admin />}
        </main>
      </div>
    </ToastProvider>)
}
