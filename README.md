# HSK 1 – Ứng dụng luyện thi (chạy local)

React + TypeScript + Vite + Tailwind + Dexie (IndexedDB) + lucide-react. Không cần backend/đăng nhập.

## Chạy trên Windows
```
node -v            (khuyến nghị Node 18+)
npm install
npm run dev        → mở http://localhost:5173
npm test           (vitest)
npm run build
```
Dữ liệu 6 đề và 39 hình đã được trích sẵn trong `src/data` và `public/assets`; không cần chạy lại bước trích xuất.

## Trích xuất lại từ DOCX (tuỳ chọn, cần Python 3 + `pip install python-docx`)
```
npm run extract    → src/data/exam01..06.json, src/data/assets.json, public/assets/imgNN.png, extraction-audit.md
```
Script `scripts/extract_docx.py` đọc thứ tự thân tài liệu (đoạn + bảng), dedupe ảnh theo SHA-256, giữ nguyên chữ Hán/Pinyin/nhãn; không tự sửa nội dung.

## Cấu trúc
- `src/data/` JSON typed mỗi đề một file + `assets.json` (ảnh)
- `src/lib/` data (loại bỏ trường đáp án khỏi dữ liệu UI), db (Dexie), scoring, answers (ghép duy nhất), schema (validate + parse file đáp án), srs
- `src/components/` QuestionView, AudioPlayer, ui (toast/modal)
- `src/pages/` Home, ExamRunner, Result, History, Review, Vocab, SettingsPage, Admin
- `tests/` data, scoring, matching, srs, persistence, renderer

## Bổ sung dữ liệu còn thiếu (Quản trị)
- **Đáp án**: Quản trị → Đáp án → nhập tay, hoặc import JSON: `{"exams":{"1":{"1":"T","2":"F","6":"B","11":"C"}}}` (T/F = Đúng/Sai; A–F cho các nhóm còn lại).
- **MP3**: Quản trị → Audio → tải `audio_01.mp3`…`audio_06.mp3` (lưu trong IndexedDB của trình duyệt). Nhập start/end (giây) và tick “xác nhận” để phát từng câu; chưa có timestamp thì chỉ phát toàn bài.
- **Nghĩa Việt**: nhập ở trang Từ vựng (đánh dấu “giáo viên bổ sung”).

## Quy ước/giả định
- Điểm /200 = 5 điểm × 40 câu là quy ước của web, không phải điểm HSK chính thức.
- Ghép duy nhất: nhóm 11–15 (theo đề) và 31–35 (giả định 5↔5). Nhóm 36–40 cho phép lặp từ.
- Chế độ thi chỉ nạp answer key khi nộp bài.
- Phím tắt: 1–6 hoặc A–F chọn đáp án, ←/→ chuyển câu.
