import docx, re, json, os, sys
sys.stdout.reconfigure(encoding='utf-8')

doc = docx.Document('HSK1_6_De_Thi_Thu_Full_Pinyin.docx')
blips = doc.element.xpath('.//a:blip/@r:embed')
print(f"Total blip tags in docx: {len(blips)}")
print(f"Unique blip target rIds: {len(set(blips))}")
from collections import Counter
c = Counter(blips)
print(f"Most common blips: {c.most_common(10)}")
