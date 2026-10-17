import { useEffect, useRef, useState } from 'react'
import { DEFAULT_SETTINGS, exportBackup, getSettings, importBackup, resetAll, saveSettings, type Settings } from '../lib/db'; import { Modal, useToast } from '../components/ui'
export default function SettingsPage() {
  const [s, setS] = useState<Settings>(DEFAULT_SETTINGS); const [confirm, setConfirm] = useState(false); const toast = useToast(); const file = useRef<HTMLInputElement>(null)
  useEffect(() => { getSettings().then(setS) }, [])
  const set = (p: Partial<Settings>) => { const n = { ...s, ...p }; setS(n); saveSettings(n) }
  const download = async () => { const b = new Blob([JSON.stringify(await exportBackup())], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `hsk1-backup-${new Date().toISOString().slice(0, 10)}.json`; a.click(); toast('Đã xuất backup (không gồm file MP3)', 'ok') }
  const upload = async (f: File) => { try { await importBackup(JSON.parse(await f.text())); toast('Đã nhập backup', 'ok') } catch (e: any) { toast(`Nhập thất bại: ${e.message}`, 'error') } }
  return (<div className="max-w-xl space-y-4"><h1 className="text-2xl font-bold">Cài đặt</h1>
    <div className="card p-5 space-y-3 text-sm">
      <label className="flex justify-between items-center">Hiện Pinyin mặc định<input type="checkbox" checked={s.showPinyin} onChange={e => set({ showPinyin: e.target.checked })} /></label>
      <label className="flex justify-between items-center">Bật đồng hồ đếm ngược (thi thử)<input type="checkbox" checked={s.timerEnabled} onChange={e => set({ timerEnabled: e.target.checked })} /></label>
      <label className="flex justify-between items-center">Thời gian (phút)<span><input type="number" min={5} max={180} className="w-20 rounded-lg border px-2 py-1" value={s.timerMinutes} onChange={e => set({ timerMinutes: Math.max(5, Number(e.target.value) || 40) })} /> <button className="btn-ghost !py-1" onClick={() => set({ timerMinutes: 40 })}>Chuẩn HSK 1 (~40′)</button></span></label>
      <label className="flex justify-between items-center">Cho phép tạm dừng khi thi<input type="checkbox" checked={s.allowPause} onChange={e => set({ allowPause: e.target.checked })} /></label>
      <label className="flex justify-between items-center">Audio trong chế độ thi<select className="rounded-lg border px-2 py-1" value={s.examAudio} onChange={e => set({ examAudio: e.target.value as Settings['examAudio'] })}><option value="full">Cho phát (toàn bài)</option><option value="off">Tắt</option></select></label>
      <label className="flex justify-between items-center">Tự phát audio câu nghe (Luyện tập)<input type="checkbox" checked={s.autoplayAudio ?? true} onChange={e => set({ autoplayAudio: e.target.checked })} /></label>
      <label className="flex justify-between items-center">Điểm mỗi câu (quy ước web)<input type="number" min={1} max={10} className="w-20 rounded-lg border px-2 py-1" value={s.pointsPerQuestion} onChange={e => set({ pointsPerQuestion: Number(e.target.value) || 5 })} /></label></div>
    <div className="card p-5 space-y-2 text-sm"><h2 className="font-semibold">Dữ liệu</h2><div className="flex flex-wrap gap-2"><button className="btn-ghost" onClick={download}>Xuất backup JSON</button><button className="btn-ghost" onClick={() => file.current?.click()}>Nhập backup JSON</button><button className="btn-ghost !text-rose-600" onClick={() => setConfirm(true)}>Reset tiến độ</button></div>
      <input ref={file} type="file" accept="application/json" hidden onChange={e => e.target.files?.[0] && upload(e.target.files[0])} /></div>
    {confirm && <Modal title="Reset tiến độ?" onClose={() => setConfirm(false)} actions={<><button className="btn-ghost" onClick={() => setConfirm(false)}>Hủy</button><button className="btn-primary" onClick={async () => { await resetAll(); setConfirm(false); toast('Đã reset tiến độ (đáp án và MP3 được giữ)', 'ok') }}>Reset</button></>}>Xóa toàn bộ bài làm, lịch ôn và từ vựng đã lưu. Đáp án, MP3 và timestamp được giữ lại.</Modal>}</div>)
}
