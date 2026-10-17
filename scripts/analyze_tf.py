import json, sys, re

sys.stdout.reconfigure(encoding='utf-8')

with open('scripts/raw_audit_records.json', 'r', encoding='utf-8') as f:
    records = json.load(f)

# ASSET SEMANTICS
ASSET_KEYWORDS = {
    "img01": {"keywords": ["猫", "mèo", "cat", "mimi"], "concept": "1 con mèo vàng (猫)"},
    "img02": {"keywords": ["电影", "电影院", "电影票", "phim", "rạp chiếu phim", "vé xem phim"], "concept": "Vé xem phim (电影票 / 看电影 / 电影院)"},
    "img03": {"keywords": ["音乐", "听音乐", "nhạc", "nghe nhạc"], "concept": "Nốt nhạc (听音乐 / 音乐)"},
    "img04": {"keywords": ["女", "phụ nữ", "cô gái"], "concept": "Khuôn mặt nữ tóc nâu (người nữ)"},
    "img05": {"keywords": ["地铁", "tàu điện", "tàu điện ngầm"], "concept": "Tàu điện ngầm trong hầm (地铁)"},
    "img06": {"keywords": ["狗", "chó", "cún"], "concept": "1 mặt chó đốm nâu (1 con chó, 狗)"},
    "img07": {"keywords": ["鱼", "cá", "fish"], "concept": "1 con cá xanh (鱼)"},
    "img08": {"keywords": ["茶", "喝茶", "trà", "uống trà"], "concept": "Tách trà xanh bốc khói (茶 / 喝茶)"},
    "img09": {"keywords": ["啤酒", "喝啤酒", "bia", "uống bia"], "concept": "Ly bia bọt (啤酒 / 喝啤酒)"},
    "img10": {"keywords": ["咖啡", "喝咖啡", "cà phê"], "concept": "Tách cà phê nóng (咖啡 / 喝咖啡)"},
    "img11": {"keywords": ["学校", "trường", "trường học"], "concept": "Trường học có đồng hồ (学校)"},
    "img12": {"keywords": ["医院", "bệnh viện"], "concept": "Bệnh viện có chữ thập đỏ (医院)"},
    "img13": {"keywords": ["银行", "ngân hàng"], "concept": "Ngân hàng có ký hiệu $ (银行)"},
    "img14": {"keywords": ["电话", "打电话", "điện thoại"], "concept": "Điện thoại bàn màu đỏ (电话 / 打电话)"},
    "img15": {"keywords": ["照片", "ảnh", "bức ảnh", "bức tranh"], "concept": "Khung tranh phong cảnh cây cỏ (照片 / bức ảnh)"},
    "img16": {"keywords": ["电脑", "máy tính", "laptop"], "concept": "Máy tính xách tay laptop (电脑)"},
    "img17": {"keywords": ["米饭", "饭", "cơm", "bát cơm"], "concept": "Bát cơm trắng (米饭 / 吃饭)"},
    "img18": {"keywords": ["生日", "蛋糕", "sinh nhật", "bánh sinh nhật"], "concept": "Bánh sinh nhật cắm 3 nến KHÔNG có ngày tháng (蛋糕 / 生日)"},
    "img19": {"keywords": ["公交车", "公共汽车", "xe buýt", "xe bus"], "concept": "Xe buýt (公交车 / 公共汽车)"},
    "img20": {"keywords": ["电影", "看电影", "phim", "quay phim", "clapperboard"], "concept": "Bảng clapperboard đóng phim (看电影 / 电影)"},
    "img21": {"keywords": ["书", "sách", "3 quyển sách"], "concept": "Chồng 3 quyển sách (3 quyển sách / 书)"},
    "img22": {"keywords": ["车", "汽车", "出租车", "xe ô tô", "ô tô", "xe hơi"], "concept": "Xe ô tô con màu đỏ (车 / 汽车 / 出租车)"},
    "img23": {"keywords": ["家", "房子", "nhà", "ngôi nhà"], "concept": "Ngôi nhà (家 / 房子)"},
    "img24": {"keywords": ["出租车", "taxi", "xe taxi"], "concept": "Xe taxi vàng có sọc caro (出租车)"},
    "img25": {"keywords": ["自行车", "xe đạp"], "concept": "Xe đạp (自行车)"},
    "img26": {"keywords": ["椅子", "ghế"], "concept": "Ghế gỗ (椅子)"},
    "img27": {"keywords": ["飞机", "máy bay", "phi cơ"], "concept": "Máy bay đang bay (飞机 / 坐飞机)"},
    "img28": {"keywords": ["菜", "白菜", "rau", "bắp cải", "cải thảo"], "concept": "Cây cải thảo / rau xanh (菜 / 白菜)"},
    "img29": {"keywords": ["苹果", "táo", "quả táo"], "concept": "Quả táo đỏ có cuống lá (苹果)"},
    "img30": {"keywords": ["肉", "thịt", "miếng thịt"], "concept": "Miếng thịt đỏ có xương (肉)"},
    "img31": {"keywords": ["树", "公园", "cây", "cây xanh", "công viên"], "concept": "Cây xanh công viên (树 / 公园)"},
    "img32": {"keywords": ["商店", "便利店", "cửa hàng"], "concept": "Cửa hàng tiện lợi 24h (商店 / 便利店)"},
    "img33": {"keywords": ["面条", "mì", "mì ý", "spaghetti"], "concept": "Đĩa mì spaghetti dĩa gắp (面条 / 吃面条)"},
    "img34": {"keywords": ["面条", "mì", "ramen"], "concept": "Tô mì ramen có trứng và đũa (面条 / 吃面条)"},
    "img35": {"keywords": ["听诊器", "ống nghe"], "concept": "Ống nghe y tế bác sĩ (ống nghe, stethoscope)"},
    "img36": {"keywords": ["葡萄", "nho", "chùm nho"], "concept": "Chùm nho tím (葡萄)"},
    "img37": {"keywords": ["公司", "工作", "公文包", "công ty", "đi làm", "cặp tài liệu"], "concept": "Cặp tài liệu da màu nâu (công văn / đi làm / 爸爸在公司工作)"},
    "img38": {"keywords": ["走路", "走", "đi bộ"], "concept": "Bé trai đang đi bộ (走路 / 走)"},
    "img39": {"keywords": ["七月十七", "july 17", "17 tháng 7"], "concept": "Tờ lịch ghi July 17 KHÔNG ghi thứ (lịch July 17)"}
}

# 1. Check answer consistency: table vs detail vs web
ans_conflicts = []
for r in records:
    t = r['docTableAns']
    d = r['docDetailAns']
    w = r['webAns']
    if t != d or d != w:
        ans_conflicts.append((r['examId'], r['questionNumber'], t, d, w, r['hanzi']))

print(f"=== ANSWER CONFLICTS BETWEEN SOURCES ({len(ans_conflicts)}) ===")
for c in ans_conflicts:
    print(f"Exam {c[0]} Q{c[1]:02d}: Table={c[2]} | Detail={c[3]} | Web={c[4]} | Hanzi={c[5]}")

print("\n=== SYSTEMATIC ANALYSIS PER QUESTION TYPE ===")

# Let's inspect each question
for r in records:
    eid = r['examId']
    qn = r['questionNumber']
    qtype = r['type']
    hz = r['hanzi']
    py = r['pinyin']
    meaning = r['meaning']
    w_ans = r['webAns']
    imgs = r['imageIds']
    
    # Check Q01-05 (Listen T/F)
    if 1 <= qn <= 5:
        # Check image vs audio
        img_id = imgs[0] if imgs else None
        desc = ASSET_KEYWORDS.get(img_id, {}).get('concept', 'Unknown')
        print(f"[E{eid:02d}-Q{qn:02d} Listen T/F] Ans:{w_ans} | Audio: '{hz}' | Img:{img_id} ({desc})")

    # Check Q21-25 (Read T/F)
    elif 21 <= qn <= 25:
        img_id = imgs[0] if imgs else None
        desc = ASSET_KEYWORDS.get(img_id, {}).get('concept', 'Unknown')
        print(f"[E{eid:02d}-Q{qn:02d} Read T/F] Ans:{w_ans} | Text: '{hz}' | Img:{img_id} ({desc})")
