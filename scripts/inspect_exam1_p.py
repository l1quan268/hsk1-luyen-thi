import docx
import sys
import re

sys.stdout.reconfigure(encoding='utf-8')
doc = docx.Document('HSK1_6_De_Dap_An_Transcript_Pinyin.docx')

# Let's inspect paragraphs 4 to 104 (Exam 1)
for i in range(4, 104):
    p = doc.paragraphs[i]
    print(f"[{i:03d}] {repr(p.text)}")
