import json, sys, re

sys.stdout.reconfigure(encoding='utf-8')

with open('scripts/raw_audit_records.json', 'r', encoding='utf-8') as f:
    records = json.load(f)

print("=== CHECKING PINYIN AND TRANSLATIONS ACROSS ALL 240 QUESTIONS ===")
py_issues = []
for r in records:
    eid = r['examId']
    qn = r['questionNumber']
    hz = r['hanzi']
    py = r['pinyin']
    exp = r['meaning']
    
    # Check if pinyin is empty
    if not py:
        py_issues.append((eid, qn, "Empty pinyin", hz, py, exp))
    # Check if explanation is empty
    if not exp:
        py_issues.append((eid, qn, "Empty explanation", hz, py, exp))
        
    # Check tone marks in pinyin: should contain tone marks or neutral
    # Tone vowels: āáǎà ēéěè īíǐì ōóǒò ūúǔù ǖǘǚǜ
    tone_vowels = "āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü"
    # if pinyin has no tone vowels, might be tone numbers or missing tone marks
    has_tone = any(c in tone_vowels for c in py)
    if not has_tone and len(py.strip()) > 3:
        py_issues.append((eid, qn, "Pinyin might lack tone marks", hz, py, exp))

print(f"Total potential pinyin/translation issues found: {len(py_issues)}")
for issue in py_issues[:30]:
    print(f"Exam {issue[0]} Q{issue[1]:02d}: {issue[2]} | Hanzi: '{issue[3]}' | Pinyin: '{issue[4]}' | Exp: '{issue[5]}'")
