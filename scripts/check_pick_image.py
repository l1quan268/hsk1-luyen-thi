import json, sys

sys.stdout.reconfigure(encoding='utf-8')

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

for eid in range(1, 7):
    with open(f'src/data/exam{eid:02d}.json', 'r', encoding='utf-8') as f: ex = json.load(f)
    with open(f'src/data/solutions{eid:02d}.json', 'r', encoding='utf-8') as f: sol = json.load(f)
    
    print(f"\n==================== EXAM {eid:02d} Section II Pick Image (06-10 and 26-30) ====================")
    for qn in list(range(6, 11)) + list(range(26, 31)):
        q = next(q for q in ex['questions'] if q['questionNumber'] == qn)
        s = sol['items'].get(str(qn), {})
        ans = sol['answers'].get(str(qn))
        hz = s.get('hanzi') or q.get('hanzi')
        choices = q.get('choices', [])
        choice_descs = [f"{c['label']}:{c.get('imageId')} ({ASSET_CONCEPTS.get(c.get('imageId'), 'Unknown')})" for c in choices]
        print(f"  Q{qn:02d} | Ans: {ans} | Hanzi: '{hz}'\n       Choices: {', '.join(choice_descs)}")
