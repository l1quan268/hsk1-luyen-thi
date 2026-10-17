import json, sys
sys.stdout.reconfigure(encoding='utf-8')

with open('src/data/assets.json', 'r', encoding='utf-8') as f:
    assets = json.load(f)

# Load solutions
solutions = {}
for eid in range(1, 7):
    with open(f'src/data/solutions{eid:02d}.json', 'r', encoding='utf-8') as f:
        solutions[eid] = json.load(f)

# Load exams
exams = {}
for eid in range(1, 7):
    with open(f'src/data/exam{eid:02d}.json', 'r', encoding='utf-8') as f:
        exams[eid] = json.load(f)

for a in assets:
    iid = a['id']
    used_by = a.get('usedBy', [])
    print(f"\n==================== {iid} ({a['file']}, docx: {a.get('docxMedia')}) - Used in {len(used_by)} questions ====================")
    for qkey in used_by:
        eid_str, qn_str = qkey.split('-')
        eid = int(eid_str)
        qn = int(qn_str)
        sol = solutions[eid]['items'].get(str(qn), {})
        q_obj = next((q for q in exams[eid]['questions'] if q['questionNumber'] == qn), {})
        qtype = q_obj.get('questionType')
        ans = sol.get('answer')
        hanzi = sol.get('hanzi') or q_obj.get('hanzi')
        exp = sol.get('explanation')
        print(f"  [{qkey}] Type:{qtype} Ans:{ans} | Hanzi:{hanzi} | Exp:{exp}")
