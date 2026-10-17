import docx
import json
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, '.')
from scripts.cross_check import parsed_exams

# Check unique choices for 11-15 and 31-35
for eid in range(1, 7):
    g11_ans = [parsed_exams[eid][qn]['answer'] for qn in range(11, 16)]
    g31_ans = [parsed_exams[eid][qn]['answer'] for qn in range(31, 36)]
    print(f"Exam {eid} Q11-15 answers: {g11_ans} (unique: {len(set(g11_ans)) == 5})")
    print(f"Exam {eid} Q31-35 answers: {g31_ans} (unique: {len(set(g31_ans)) == 5})")

# Check reading text match
print("\n--- Checking reading text similarity Q21-40 ---")
mismatches = []
for eid in range(1, 7):
    with open(f'src/data/exam{eid:02d}.json', 'r', encoding='utf-8') as f:
        ex = json.load(f)
    for q in ex['questions']:
        qn = q['questionNumber']
        if qn >= 21 and qn <= 40:
            doc_h = re.sub(r'[\s_—]+', '', parsed_exams[eid][qn]['hanzi'])
            orig_h = re.sub(r'[\s_—]+', '', q.get('hanzi') or '')
            if doc_h != orig_h:
                mismatches.append((eid, qn, doc_h, orig_h))

print(f"Reading text mismatches count: {len(mismatches)}")
for m in mismatches[:10]:
    print(f"Exam {m[0]} Q{m[1]}: Doc='{m[2]}' vs Orig='{m[3]}'")
