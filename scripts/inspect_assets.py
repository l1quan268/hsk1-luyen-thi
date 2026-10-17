import json

with open('src/data/assets.json', 'r', encoding='utf-8') as f:
    assets = json.load(f)

for a in assets:
    used = a.get('usedBy', [])
    print(f"{a['id']}: file={a['file']}, docx={a.get('docxMedia')}, usedBy={len(used)} questions: {used[:8]}")
