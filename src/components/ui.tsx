import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { X } from 'lucide-react'
type Toast = { id: number; msg: string; kind: 'info' | 'error' | 'ok' }
const Ctx = createContext<(msg: string, kind?: Toast['kind']) => void>(() => {})
export const useToast = () => useContext(Ctx)
export function ToastProvider({ children }: { children: ReactNode }) {
  const [list, setList] = useState<Toast[]>([])
  const push = useCallback((msg: string, kind: Toast['kind'] = 'info') => { const id = Date.now() + Math.random(); setList(l => [...l, { id, msg, kind }]); setTimeout(() => setList(l => l.filter(t => t.id !== id)), 4000) }, [])
  return <Ctx.Provider value={push}>{children}
    <div className="fixed bottom-4 right-4 z-50 space-y-2" role="status">{list.map(t => <div key={t.id} className={`card px-4 py-3 text-sm max-w-xs border-l-4 ${t.kind === 'error' ? 'border-rose-500' : t.kind === 'ok' ? 'border-emerald-500' : 'border-jade-500'}`}>{t.msg}</div>)}</div></Ctx.Provider>
}
export function Modal({ title, children, onClose, actions }: { title: string; children: ReactNode; onClose: () => void; actions?: ReactNode }) {
  return <div className="fixed inset-0 z-40 grid place-items-center bg-ink/40 p-4" onClick={onClose}>
    <div className="card w-full max-w-md p-5" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
      <div className="flex justify-between items-start mb-3"><h2 className="text-lg font-bold">{title}</h2><button aria-label="Đóng" onClick={onClose}><X className="h-5 w-5" /></button></div>
      <div className="text-sm space-y-2">{children}</div>{actions && <div className="flex justify-end gap-2 mt-5">{actions}</div>}</div></div>
}
export const pad = (n: number) => String(n).padStart(2, '0')
export const fmtTime = (s: number) => `${pad(Math.floor(s / 60))}:${pad(s % 60)}`
export const fmtDate = (t?: number) => t ? new Date(t).toLocaleString('vi-VN') : '—'
