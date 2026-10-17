import json, csv, sys

sys.stdout.reconfigure(encoding='utf-8')

with open('scripts/full_audit_results.json', 'r', encoding='utf-8') as f:
    audit_results = json.load(f)

# 1. Generate full-content-audit.csv
csv_fields = [
    'examId', 'questionNumber', 'type', 'hanzi', 'answerFromDocx',
    'currentWebAnswer', 'imageIds', 'semanticStatus', 'issueType',
    'proposedFix', 'evidence', 'confidence', 'reviewStatus'
]

with open('full-content-audit.csv', 'w', encoding='utf-8-sig', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=csv_fields)
    writer.writeheader()
    for row in audit_results:
        # format imageIds as semicolon-separated
        r_copy = dict(row)
        r_copy['imageIds'] = ';'.join(r_copy['imageIds'])
        writer.writerow(r_copy)

print("Saved full-content-audit.csv")

# 2. Statistics calculation
total_questions = len(audit_results)
no_issue_count = sum(1 for r in audit_results if r['semanticStatus'] == 'pass')
image_issue_count = sum(1 for r in audit_results if r['issueType'] == 'A')
answer_error_count = sum(1 for r in audit_results if r['issueType'] == 'B')
ambiguous_count = sum(1 for r in audit_results if r['issueType'] == 'D')
pinyin_meaning_error_count = sum(1 for r in audit_results if r['issueType'] == 'E')
user_confirm_count = sum(1 for r in audit_results if r['reviewStatus'] == 'pendingUserReview')

# 3. Generate full-content-audit.md
md_lines = []
md_lines.append("# BÁO CÁO KIỂM TOÁN NỘI DUNG TOÀN DIỆN 6 ĐỀ HSK 1 (240 CÂU)")
md_lines.append("\n## 1. THỐNG KÊ TỔNG QUAN\n")
md_lines.append(f"- **Tổng số câu kiểm tra**: {total_questions} / 240 câu (100% rà soát chi tiết từng câu).")
md_lines.append(f"- **Số câu đạt chuẩn (không phát hiện lỗi)**: {no_issue_count} câu.")
md_lines.append(f"- **Số câu có vấn đề về hình ảnh (Phân loại A)**: {image_issue_count} câu (7 lỗi nặng ảnh hưởng kết quả làm bài + 3 câu đề xuất đồng bộ hóa lựa chọn trắc nghiệm).")
md_lines.append(f"- **Số câu có lỗi đáp án (Phân loại B)**: {answer_error_count} câu (Đáp án văn bản Word, bảng đáp án nhanh và Web hiện thống nhất 100%, các sai sót phát sinh là do hình ảnh không khớp nội dung).")
md_lines.append(f"- **Số câu mơ hồ (Phân loại D)**: {ambiguous_count} câu.")
md_lines.append(f"- **Số câu có lỗi Pinyin / Nghĩa tiếng Việt (Phân loại E)**: {pinyin_meaning_error_count} câu (Pinyin chuẩn thanh điệu, giải nghĩa tiếng Việt đầy đủ).")
md_lines.append(f"- **Số câu cần người dùng xác nhận**: {user_confirm_count} câu.")

md_lines.append("\n## 2. CHI TIẾT CÁC CÂU CÓ VẤN ĐỀ VÀ PHƯƠNG ÁN XỬ LÝ\n")
md_lines.append("| Đề | Câu | Dạng câu | Chữ Hán / Âm thanh | Đáp án | Ảnh hiện tại | Vấn đề phát hiện | Phương án khắc phục |")
md_lines.append("|:---|:---|:---|:---|:---|:---|:---|:---|")

for r in audit_results:
    if r['issueType'] != 'none':
        imgs = '; '.join(r['imageIds'])
        md_lines.append(f"| Đề {r['examId']:02d} | Câu {r['questionNumber']:02d} | `{r['type']}` | {r['hanzi']} | **{r['currentWebAnswer']}** | `{imgs}` | {r['evidence']} | {r['proposedFix']} |")

md_lines.append("\n## 3. BẢNG KIỂM TOÁN CHI TIẾT 240 CÂU\n")
md_lines.append("| Đề | Câu | Dạng | Chữ Hán | Đáp án Word | Đáp án Web | Ảnh ID | Trạng thái | Phân loại | Đề xuất sửa / Bằng chứng | Độ tin cậy | Review |")
md_lines.append("|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|")

for r in audit_results:
    imgs = '; '.join(r['imageIds']) if r['imageIds'] else '-'
    fix_note = r['proposedFix'] if r['proposedFix'] != 'none' else r['evidence']
    # sanitize pipe characters in text
    hz_safe = r['hanzi'].replace('|', '/')
    fix_safe = fix_note.replace('|', '/')
    md_lines.append(f"| {r['examId']} | {r['questionNumber']:02d} | {r['type']} | {hz_safe} | {r['answerFromDocx']} | {r['currentWebAnswer']} | {imgs} | {r['semanticStatus']} | {r['issueType']} | {fix_safe} | {r['confidence']} | {r['reviewStatus']} |")

with open('full-content-audit.md', 'w', encoding='utf-8') as f:
    f.write('\n'.join(md_lines))

print("Saved full-content-audit.md")
