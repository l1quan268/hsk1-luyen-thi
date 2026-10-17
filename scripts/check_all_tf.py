import json, sys

sys.stdout.reconfigure(encoding='utf-8')

with open('scripts/raw_audit_records.json', 'r', encoding='utf-8') as f:
    records = json.load(f)

ASSET_CONCEPTS = {
    "img01": "1 con mèo vàng (猫)",
    "img02": "Vé xem phim (看电影 / 电影票 / 电影院)",
    "img03": "Nốt nhạc (听音乐 / 音乐)",
    "img04": "Khuôn mặt nữ tóc nâu (người nữ)",
    "img05": "Tàu điện ngầm trong hầm (地铁)",
    "img06": "1 mặt chó đốm nâu (1 con chó, 狗)",
    "img07": "1 con cá xanh (鱼)",
    "img08": "Tách trà xanh bốc khói (茶 / 喝茶)",
    "img09": "Ly bia bọt (啤酒 / 喝啤酒)",
    "img10": "Tách cà phê nóng (咖啡 / 喝咖啡)",
    "img11": "Trường học có đồng hồ (学校)",
    "img12": "Bệnh viện có chữ thập đỏ (医院)",
    "img13": "Ngân hàng có ký hiệu $ (银行)",
    "img14": "Điện thoại bàn màu đỏ (电话 / 打电话)",
    "img15": "Khung tranh phong cảnh cây cỏ (照片 / bức ảnh)",
    "img16": "Máy tính xách tay laptop (电脑)",
    "img17": "Bát cơm trắng (米饭 / 吃饭)",
    "img18": "Bánh sinh nhật cắm 3 nến (蛋糕 / 生日)",
    "img19": "Xe buýt (公交车 / 公共汽车)",
    "img20": "Bảng clapperboard đóng phim (看电影 / 电影)",
    "img21": "Chồng 3 quyển sách (3 quyển sách / 书)",
    "img22": "Xe ô tô con màu đỏ (车 / 汽车 / 出租车)",
    "img23": "Ngôi nhà (家 / 房子)",
    "img24": "Xe taxi vàng có sọc caro (出租车)",
    "img25": "Xe đạp (自行车)",
    "img26": "Ghế gỗ (椅子)",
    "img27": "Máy bay đang bay (飞机 / 坐飞机)",
    "img28": "Cây cải thảo / rau xanh (菜 / 白菜)",
    "img29": "Quả táo đỏ có cuống lá (苹果)",
    "img30": "Miếng thịt đỏ có xương (肉)",
    "img31": "Cây xanh công viên (树 / 公园)",
    "img32": "Cửa hàng tiện lợi 24h (商店 / 便利店)",
    "img33": "Đĩa mì spaghetti dĩa gắp (面条 / 吃面条)",
    "img34": "Tô mì ramen có trứng và đũa (面条 / 吃面条)",
    "img35": "Ống nghe y tế bác sĩ (ống nghe, stethoscope)",
    "img36": "Chùm nho tím (葡萄)",
    "img37": "Cặp tài liệu da màu nâu (công văn / đi làm / 爸爸在公司工作)",
    "img38": "Bé trai đang đi bộ (走路 / 走)",
    "img39": "Tờ lịch ghi July 17 (lịch July 17)"
}

tf_records = [r for r in records if (1 <= r['questionNumber'] <= 5) or (21 <= r['questionNumber'] <= 25)]

print(f"Total T/F questions: {len(tf_records)}")
for r in tf_records:
    eid = r['examId']
    qn = r['questionNumber']
    sec = r['section']
    hz = r['hanzi']
    py = r['pinyin']
    meaning = r['meaning']
    ans = r['webAns']
    img_id = r['imageIds'][0] if r['imageIds'] else 'None'
    desc = ASSET_CONCEPTS.get(img_id, 'Unknown')
    
    # Evaluate semantic consistency
    # Let's inspect potential issues
    notes = []
    if "狗" in hz and "两" in hz and img_id == "img06" and ans == "T":
        notes.append("ISSUE: Câu nói '两只狗' (2 con chó) nhưng ảnh chỉ có 1 mặt chó.")
    if "哥哥" in hz and "老师" in hz and img_id == "img04" and ans == "T":
        notes.append("ISSUE: Câu nói '哥哥是老师' (anh trai là giáo viên) nhưng ảnh là khuôn mặt nữ.")
    if "一本书" in hz and img_id == "img21" and ans == "T":
        notes.append("ISSUE: Câu nói '一本书' (1 quyển sách) nhưng ảnh là chồng 3 quyển sách.")
    if "姐姐" in hz and "医生" in hz and img_id == "img35" and ans == "T":
        notes.append("ISSUE: Câu nói '姐姐是医生' (chị gái là bác sĩ) nhưng ảnh chỉ là ống nghe, không có người/chị gái.")
    if "星期五" in hz and img_id == "img39" and ans == "T":
        notes.append("ISSUE: Câu nói '今天星期五' nhưng ảnh lịch chỉ ghi July 17, không ghi thứ.")
    if "八月十七号" in hz and img_id == "img18" and ans == "T":
        notes.append("ISSUE: Câu nói '八月十七号' nhưng ảnh bánh sinh nhật không có ngày tháng.")
        
    # Check for other potential mismatches
    note_str = " *** " + " ".join(notes) if notes else ""
    print(f"E{eid:02d}-Q{qn:02d} ({sec[:4]}) | Ans: {ans:1s} | Img: {img_id:5s} ({desc[:25]:25s}) | Text: '{hz}'{note_str}")
