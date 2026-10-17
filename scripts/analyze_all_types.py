import json, sys, re

sys.stdout.reconfigure(encoding='utf-8')

with open('scripts/raw_audit_records.json', 'r', encoding='utf-8') as f:
    records = json.load(f)

# Load exam files to see full choice data
exams = {}
for eid in range(1, 7):
    with open(f'src/data/exam{eid:02d}.json', 'r', encoding='utf-8') as f:
        exams[eid] = json.load(f)

print("==================== Q06-10: LISTEN PICK IMAGE (A/B/C) ====================")
for r in records:
    if 6 <= r['questionNumber'] <= 10:
        eid = r['examId']
        qn = r['questionNumber']
        hz = r['hanzi']
        ans = r['webAns']
        q_obj = next(q for q in exams[eid]['questions'] if q['questionNumber'] == qn)
        choices = q_obj.get('choices', [])
        c_str = ", ".join([f"{c['label']}:{c.get('imageId')}" for c in choices])
        print(f"E{eid:02d}-Q{qn:02d} | Ans: {ans} | Audio: '{hz}' | Choices: [{c_str}]")

print("\n==================== Q11-15: LISTEN MATCH IMAGE (A-E) ====================")
for eid in range(1, 7):
    print(f"\n--- Exam {eid:02d} Section III (11-15) ---")
    bank_imgs = exams[eid]['questions'][10].get('imageIds', [])
    print(f"Bank images: {bank_imgs} (A={bank_imgs[0] if len(bank_imgs)>0 else ''}, B={bank_imgs[1] if len(bank_imgs)>1 else ''}, C={bank_imgs[2] if len(bank_imgs)>2 else ''}, D={bank_imgs[3] if len(bank_imgs)>3 else ''}, E={bank_imgs[4] if len(bank_imgs)>4 else ''})")
    for qn in range(11, 16):
        r = next(x for x in records if x['examId'] == eid and x['questionNumber'] == qn)
        ans = r['webAns']
        hz = r['hanzi']
        # which image does ans map to?
        lbl_idx = ord(ans) - ord('A') if ans in 'ABCDE' else -1
        matched_img = bank_imgs[lbl_idx] if 0 <= lbl_idx < len(bank_imgs) else 'ERR'
        print(f"  Q{qn:02d} | Ans: {ans} -> {matched_img} | Audio: '{hz}' | Exp: {r['meaning']}")

print("\n==================== Q16-20: LISTEN DIALOGUE (A/B/C) ====================")
for r in records:
    if 16 <= r['questionNumber'] <= 20:
        eid = r['examId']
        qn = r['questionNumber']
        hz = r['hanzi']
        ans = r['webAns']
        q_obj = next(q for q in exams[eid]['questions'] if q['questionNumber'] == qn)
        choices = q_obj.get('choices', [])
        c_str = " | ".join([f"{c['label']}. {c.get('hanzi','') or c.get('text','')}" for c in choices])
        print(f"E{eid:02d}-Q{qn:02d} | Ans: {ans} | Dialogue: '{hz}' | Choices: [{c_str}]")

print("\n==================== Q26-30: READ PICK IMAGE (A/B/C) ====================")
for r in records:
    if 26 <= r['questionNumber'] <= 30:
        eid = r['examId']
        qn = r['questionNumber']
        hz = r['hanzi']
        ans = r['webAns']
        q_obj = next(q for q in exams[eid]['questions'] if q['questionNumber'] == qn)
        choices = q_obj.get('choices', [])
        c_str = ", ".join([f"{c['label']}:{c.get('imageId')}" for c in choices])
        print(f"E{eid:02d}-Q{qn:02d} | Ans: {ans} | Text: '{hz}' | Choices: [{c_str}]")

print("\n==================== Q31-35: READ MATCH DIALOGUE (A-E) ====================")
for eid in range(1, 7):
    print(f"\n--- Exam {eid:02d} Section III Reading (31-35) ---")
    # let's look at bank answers
    for qn in range(31, 36):
        r = next(x for x in records if x['examId'] == eid and x['questionNumber'] == qn)
        ans = r['webAns']
        hz = r['hanzi']
        matched = r['solItem'].get('matchedAnswer', {})
        m_hz = matched.get('hanzi') if matched else ''
        print(f"  Q{qn:02d} | Ans: {ans} -> '{m_hz}' | Question: '{hz}' | Exp: {r['meaning']}")

print("\n==================== Q36-40: READ FILL BLANK (A-F) ====================")
for eid in range(1, 7):
    print(f"\n--- Exam {eid:02d} Section IV Reading (36-40) ---")
    for qn in range(36, 41):
        r = next(x for x in records if x['examId'] == eid and x['questionNumber'] == qn)
        ans = r['webAns']
        hz = r['hanzi']
        fill = r['solItem'].get('fillWord', {})
        f_hz = fill.get('hanzi') if fill else ''
        complete = r['solItem'].get('completeSentence', '')
        print(f"  Q{qn:02d} | Ans: {ans} ({f_hz}) | Sentence: '{hz}' -> Complete: '{complete}'")
