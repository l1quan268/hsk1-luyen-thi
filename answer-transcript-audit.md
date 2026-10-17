# Báo cáo Kiểm định Đáp án và Transcript HSK 1 (Đề 01–06)

Tài liệu nguồn: `HSK1_6_De_Dap_An_Transcript_Pinyin.docx`
Thời gian thực hiện: 2026-10-17

---

## 1. Tổng quan Trích xuất

- **Số lượng đề**: 6 đề thi HSK 1 (Đề 01 đến Đề 06).
- **Tổng số câu hỏi**: 240 câu (40 câu/đề × 6 đề).
- **Phần Nghe (01–20)**: 120 câu có đầy đủ chữ Hán transcript, Pinyin và giải nghĩa tiếng Việt tương ứng.
- **Phần Đọc (21–40)**: 120 câu có đáp án, Pinyin, giải nghĩa, cặp câu nối (31–35) và từ điền hoàn chỉnh (36–40).

---

## 2. Đối chiếu Tính nhất quán Nội bộ (Table vs Detail)

Đối chiếu giữa **BẢNG ĐÁP ÁN NHANH** (6 bảng tổng quan) và **CHI TIẾT TỪNG CÂU**:
- Số mâu thuẫn phát hiện: **0** (100% khớp tuyệt đối 240/240 câu).
- Chuẩn hóa ký hiệu:
  - `✓` chuyển thành `T` (True).
  - `✗` chuyển thành `F` (False).
  - Các lựa chọn chữ cái: giữ nguyên `A`, `B`, `C`, `D`, `E`, `F`.

---

## 3. Đối chiếu với Đề gốc (`exam01.json` – `exam06.json`)

- **Kiểm tra nhãn lựa chọn hợp lệ**: Mọi đáp án đều thuộc tập hợp lựa chọn (`choices`) của từng câu hỏi trong đề gốc. Không có câu nào có đáp án nằm ngoài các lựa chọn cho phép.
- **Kiểm tra tính duy nhất nhóm ghép**:
  - Nhóm ghép hình nghe (câu 11–15): Mỗi lựa chọn A–E xuất hiện đúng 1 lần cho mỗi đề.
  - Nhóm ghép câu đọc (câu 31–35): Mỗi lựa chọn A–E xuất hiện đúng 1 lần cho mỗi đề.
- **Kiểm tra nội dung câu đọc 21–40**:
  - Chữ Hán câu đọc trong file đáp án khớp hoàn toàn với đề gốc (không phát hiện sai lệch văn bản).

---

## 4. Thống kê theo từng Đề

| Đề thi | Số đáp án | Transcript Nghe (1–20) | Pinyin + Nghĩa Việt | Nhóm Nối (31–35) | Nhóm Điền từ (36–40) |
|---|---|---|---|---|---|
| **Đề 01** | 40/40 | 20/20 | 40/40 | 5/5 cặp nối | 5/5 câu hoàn chỉnh |
| **Đề 02** | 40/40 | 20/20 | 40/40 | 5/5 cặp nối | 5/5 câu hoàn chỉnh |
| **Đề 03** | 40/40 | 20/20 | 40/40 | 5/5 cặp nối | 5/5 câu hoàn chỉnh |
| **Đề 04** | 40/40 | 20/20 | 40/40 | 5/5 cặp nối | 5/5 câu hoàn chỉnh |
| **Đề 05** | 40/40 | 20/20 | 40/40 | 5/5 cặp nối | 5/5 câu hoàn chỉnh |
| **Đề 06** | 40/40 | 20/20 | 40/40 | 5/5 cặp nối | 5/5 câu hoàn chỉnh |

---

## 5. Quy tắc Tích hợp & Bảo mật Đề thi

1. Dữ liệu giải thích và transcript được lưu độc lập tại `src/data/solutions01.json` đến `src/data/solutions06.json`.
2. Không nhúng trực tiếp đáp án/transcript vào `exam01.json` – `exam06.json` dùng lúc làm bài.
3. Trong chế độ Thi thử: Chỉ nạp và sử dụng đáp án khi người dùng bấm Nộp bài. Không để lộ transcript hoặc đáp án trước khi hoàn thành bài thi.
4. Trong chế độ Luyện tập và Ôn câu sai: Cho phép bật/tắt Pinyin và giải nghĩa tiếng Việt linh hoạt.
