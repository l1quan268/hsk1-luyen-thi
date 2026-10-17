import json, sys

sys.stdout.reconfigure(encoding='utf-8')

for eid in range(1, 7):
    with open(f'src/data/exam{eid:02d}.json', 'r', encoding='utf-8') as f: ex = json.load(f)
    with open(f'src/data/solutions{eid:02d}.json', 'r', encoding='utf-8') as f: sol = json.load(f)
    
    print(f"\n==================== EXAM {eid:02d} Section III (11-15) ====================")
    q11 = next(q for q in ex['questions'] if q['questionNumber'] == 11)
    choices = q11.get('choices', [])
    choice_map = {c['label']: c.get('imageId') for c in choices}
    print(f"Choices bank: {choice_map}")
    
    for qn in range(11, 16):
        q = next(q for q in ex['questions'] if q['questionNumber'] == qn)
        s = sol['items'].get(str(qn), {})
        ans = sol['answers'].get(str(qn))
        img = choice_map.get(ans)
        hz = s.get('hanzi')
        exp = s.get('explanation')
        print(f"  Q{qn:02d} | Ans: {ans} ({img}) | Hanzi: '{hz}' | Exp: {exp}")
