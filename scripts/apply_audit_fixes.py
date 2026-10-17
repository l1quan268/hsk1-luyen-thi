import json, hashlib, os, sys

sys.stdout.reconfigure(encoding='utf-8')

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS_DIR = os.path.join(ROOT, 'public/assets')
DATA_DIR = os.path.join(ROOT, 'src/data')

# 1. Load current assets.json
with open(os.path.join(DATA_DIR, 'assets.json'), 'r', encoding='utf-8') as f:
    assets = json.load(f)

assets_dict = {a['id']: a for a in assets}

# 2. Add new assets img40 - img45
new_asset_ids = ['img40', 'img41', 'img42', 'img43', 'img44', 'img45']
for iid in new_asset_ids:
    fn = f"{iid}.png"
    fp = os.path.join(ASSETS_DIR, fn)
    with open(fp, 'rb') as f:
        data = f.read()
    h = hashlib.sha256(data).hexdigest()
    assets_dict[iid] = {
        "id": iid,
        "file": f"assets/{fn}",
        "bytes": len(data),
        "sha256": h,
        "docxMedia": f"custom_{iid}.png",
        "usedBy": []
    }
    print(f"Registered {iid}: {len(data)} bytes, sha256={h[:10]}...")

# 3. Load and update exams
exams = {}
for eid in range(1, 7):
    p = os.path.join(DATA_DIR, f'exam{eid:02d}.json')
    with open(p, 'r', encoding='utf-8') as f:
        exams[eid] = json.load(f)

# Apply specific updates
# E01-Q04: 我哥哥是老师。 -> img40 (thầy giáo nam)
q = next(q for q in exams[1]['questions'] if q['questionNumber'] == 4)
print(f"E01-Q04 imageIds before: {q['imageIds']} -> after: ['img40']")
q['imageIds'] = ['img40']

# E01-Q23: 他想买一本书。 -> img41 (đúng 1 quyển sách)
q = next(q for q in exams[1]['questions'] if q['questionNumber'] == 23)
print(f"E01-Q23 imageIds before: {q['imageIds']} -> after: ['img41']")
q['imageIds'] = ['img41']

# E02-Q22: 我家有两只狗。 -> img42 (2 chú chó)
q = next(q for q in exams[2]['questions'] if q['questionNumber'] == 22)
print(f"E02-Q22 imageIds before: {q['imageIds']} -> after: ['img42']")
q['imageIds'] = ['img42']

# E03-Q04: 我家有两只狗。 -> img42 (2 chú chó)
q = next(q for q in exams[3]['questions'] if q['questionNumber'] == 4)
print(f"E03-Q04 imageIds before: {q['imageIds']} -> after: ['img42']")
q['imageIds'] = ['img42']

# E04-Q05: 我姐姐是医生。 -> img43 (nữ bác sĩ)
q = next(q for q in exams[4]['questions'] if q['questionNumber'] == 5)
print(f"E04-Q05 imageIds before: {q['imageIds']} -> after: ['img43']")
q['imageIds'] = ['img43']

# E04-Q09: 我家有两只狗。 -> choice B: img42 (2 chú chó)
q = next(q for q in exams[4]['questions'] if q['questionNumber'] == 9)
for c in q['choices']:
    if c['label'] == 'B':
        print(f"E04-Q09 choice B before: {c.get('imageId')} -> after: 'img42'")
        c['imageId'] = 'img42'

# E05-Q06: 我哥哥是老师。 -> choice A: img40 (thầy giáo nam)
q = next(q for q in exams[5]['questions'] if q['questionNumber'] == 6)
for c in q['choices']:
    if c['label'] == 'A':
        print(f"E05-Q06 choice A before: {c.get('imageId')} -> after: 'img40'")
        c['imageId'] = 'img40'

# E05-Q21: 今天星期五。 -> img44 (lịch thứ Sáu FRI / 星期五)
q = next(q for q in exams[5]['questions'] if q['questionNumber'] == 21)
print(f"E05-Q21 imageIds before: {q['imageIds']} -> after: ['img44']")
q['imageIds'] = ['img44']

# E05-Q23: 我的生日是八月十七号。 -> img45 (bánh sinh nhật 8月17日)
q = next(q for q in exams[5]['questions'] if q['questionNumber'] == 23)
print(f"E05-Q23 imageIds before: {q['imageIds']} -> after: ['img45']")
q['imageIds'] = ['img45']

# E06-Q06: 我的生日是八月十七号。 -> choice A: img45 (bánh sinh nhật 8月17日)
q = next(q for q in exams[6]['questions'] if q['questionNumber'] == 6)
for c in q['choices']:
    if c['label'] == 'A':
        print(f"E06-Q06 choice A before: {c.get('imageId')} -> after: 'img45'")
        c['imageId'] = 'img45'

# 4. Save updated exams
for eid in range(1, 7):
    p = os.path.join(DATA_DIR, f'exam{eid:02d}.json')
    with open(p, 'w', encoding='utf-8') as f:
        json.dump(exams[eid], f, ensure_ascii=False, indent=1)
    print(f"Saved exam{eid:02d}.json")

# 5. Recompute usedBy for all assets
for a in assets_dict.values():
    a['usedBy'] = []

for eid in range(1, 7):
    for q in exams[eid]['questions']:
        qn = q['questionNumber']
        qkey = f"{eid:02d}-{qn:02d}"
        for iid in q.get('imageIds', []):
            if iid in assets_dict and qkey not in assets_dict[iid]['usedBy']:
                assets_dict[iid]['usedBy'].append(qkey)
        for c in q.get('choices', []):
            cid = c.get('imageId')
            if cid and cid in assets_dict and qkey not in assets_dict[cid]['usedBy']:
                assets_dict[cid]['usedBy'].append(qkey)

# Sort assets list by ID
sorted_assets = [assets_dict[k] for k in sorted(assets_dict.keys(), key=lambda x: int(x.replace('img', '')))]

with open(os.path.join(DATA_DIR, 'assets.json'), 'w', encoding='utf-8') as f:
    json.dump(sorted_assets, f, ensure_ascii=False, indent=1)
print(f"Saved assets.json with {len(sorted_assets)} assets.")
