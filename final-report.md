# Báo cáo cuối

| Hạng mục | Kết quả |
|---|---|
| Đề / câu trích xuất | 6 / 240 (mỗi đề 40; 8 nhóm/đề; kiểm tra tự động) |
| Hình | 270 drawing inline → 39 ảnh duy nhất, 390 tham chiếu hình–câu, 0 ảnh mồ côi |
| Audio tích hợp | 0/6 (chưa cung cấp MP3; app có tải lên + hướng dẫn) |
| Câu có đáp án xác thực | 0/240 (Word không chứa đáp án; không bịa) |
| Lời nghe, nghĩa Việt, giải thích | Không có trong Word → trạng thái “chưa có dữ liệu” |

## Đã kiểm chứng
- Trích xuất chạy thật; cấu trúc 240 câu được assert tự động.
- Logic thuần (chấm điểm, ghép duy nhất, parse đáp án, SRS, thiếu answer key) chạy thật bằng Node trên dữ liệu thật: pass.
- Cú pháp TS/TSX: 0 lỗi cú pháp.

## CHƯA kiểm chứng (môi trường không có mạng tới npm)
- `npm install`, `npm run build`, `npm test` (vitest), kiểm tra kiểu đầy đủ, chạy trình duyệt, chụp UI desktop/mobile, console errors.
- Có thể còn lỗi kiểu/runtime nhỏ khi chạy lần đầu; xin gửi log để sửa.

## Chưa làm / còn hạn chế
- Waveform: chỉ nhập start/end thủ công + tick xác nhận.
- Ôn tập: chưa có chế độ “làm lại câu sai” theo nhóm ngoài hàng đợi SRS; chưa có tìm kiếm trong Từ vựng.
- Nghĩa Việt/giải thích/từ trọng tâm: chỉ có ô nhập nghĩa; chưa có import dữ liệu học tập riêng.
- Import DOCX trực tiếp trong giao diện: dùng script Python (đã chạy) thay thế.
- Câu 21–25 tách Hán tự/Pinyin bằng dấu câu 。？！ (đã kiểm tra mẫu; nên soát tay toàn bộ).
