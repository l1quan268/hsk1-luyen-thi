import json, sys

sys.stdout.reconfigure(encoding='utf-8')

with open('scripts/raw_audit_records.json', 'r', encoding='utf-8') as f:
    records = json.load(f)

for r in records:
    print(f"E{r['examId']:02d}-Q{r['questionNumber']:02d} | Ans:{r['webAns']:1s} | {r['hanzi']} | {r['pinyin']} | {r['meaning']}")
