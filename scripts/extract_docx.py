#!/usr/bin/env python3
"""DOCX -> JSON + assets + extraction-audit.md. Usage: python scripts/extract_docx.py <file.docx>"""
import sys, re, json, hashlib, shutil, zipfile, os
import docx
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = sys.argv[1]
d = docx.Document(SRC)
rels = {r.rId: r for r in d.part.rels.values() if 'image' in r.reltype}
W = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'

# ---- images: dedupe by content hash, copy to public/assets
img_by_rid, hash_to_id, assets = {}, {}, {}
for rid, r in sorted(rels.items(), key=lambda kv: int(re.sub(r'\D', '', kv[0]))):
    blob = r.target_part.blob
    h = hashlib.sha256(blob).hexdigest()
    if h not in hash_to_id:
        iid = f"img{len(hash_to_id)+1:02d}"
        hash_to_id[h] = iid
        fn = f"{iid}.png"
        open(os.path.join(ROOT, 'public/assets', fn), 'wb').write(blob)
        assets[iid] = {"id": iid, "file": f"assets/{fn}", "bytes": len(blob), "sha256": h, "docxMedia": r.target_ref.split('/')[-1], "usedBy": []}
    img_by_rid[rid] = hash_to_id[h]

def lines(p):
    """paragraph -> list of text lines (split on <w:br/>)"""
    out = ['']
    for el in p.iter():
        if el.tag == W+'t': out[-1] += el.text or ''
        elif el.tag == W+'br': out.append('')
    return out
def imgs(el):
    return [img_by_rid[x] for x in el.xpath('.//a:blip/@r:embed')]
def ptext(p): return ' '.join(l for l in lines(p) if l).strip()

# ---- walk body into flat token stream
toks = []
for ch in d.element.body:
    t = ch.tag.split('}')[1]
    if t == 'p':
        from docx.text.paragraph import Paragraph
        p = Paragraph(ch, d)
        L = lines(ch)
        if ''.join(L).strip() or imgs(ch): toks.append(('p', L, imgs(ch)))
    elif t == 'tbl':
        from docx.table import Table
        rows = []
        for tr in Table(ch, d).rows:
            row = []
            for tc in tr._tr.xpath('./w:tc'):
                cl = [lines(p) for p in tc.xpath('./w:p')]
                row.append({"lines": [l for L in cl for l in L if l.strip()], "imgs": imgs(tc)})
            rows.append(row)
        toks.append(('t', rows))

# ---- split into exams
exam_starts = [i for i, t in enumerate(toks) if t[0]=='p' and re.match(r'^ĐỀ 0(\d)', t[1][0])]
audit = {"warnings": [], "exams": {}}
def warn(m): audit["warnings"].append(m)

def split_hz_py(L):
    """['Câu 21.  我哥哥…。','wǒ gēge…','□ ✓ …'] style handled by caller"""
    return L

CAU = re.compile(r'^Câu\s+(\d+)[\.:]\s*')
CH = re.compile(r'^([A-F])\.\s*')
def hz_py(text_lines):
    """text_lines: lines after 'Câu N.' prefix removed. first=hanzi, second=pinyin"""
    hz = text_lines[0].strip() if text_lines else ''
    py = text_lines[1].strip() if len(text_lines) > 1 else ''
    return hz, py

def strip_blank(s):
    return re.sub(r'\s*\(\s*_+\s*\)\s*$', '', re.sub(r'\s*\(\s*(_\s*)+\)\s*$', '', s)).strip()

exams = []
for k, st in enumerate(exam_starts):
    en = exam_starts[k+1] if k+1 < len(exam_starts) else len(toks)
    body = toks[st:en]
    eid = k+1
    title = toks[st][1][0]
    group = 'A' if eid <= 3 else 'B'
    Qs = {}
    banks = {}
    def add(n, **kw):
        if n in Qs: warn(f"Đề {eid:02d}: trùng câu {n}")
        base = dict(examId=eid, questionNumber=n, section='listening' if n <= 20 else 'reading', hanzi='', pinyin='', imageIds=[], choices=[], correctAnswer=None, answerStatus='missing', sourceRef=f"{os.path.basename(SRC)} › {title}", audio=None)
        base.update(kw); Qs[n] = base
    i = 0
    cur_sec = None   # roman group index within exam
    # Track groups by roman headers
    grp_ranges = []
    while i < len(body):
        t = body[i]
        if t[0] == 'p':
            L = t[1]; txt = ' '.join(x for x in L if x).strip()
            m = re.match(r'^(I|II|III|IV)\.\s*(\d+)[–-](\d+)\s*\|\s*(.*)$', re.sub(r'\s+', ' ', txt))
            if m:
                lo, hi = int(m.group(2)), int(m.group(3))
                grp_ranges.append(dict(roman=m.group(1), from_=lo, to=hi, instruction=m.group(4)))
                i += 1; continue
        i += 1
    # second pass: question extraction by group
    def find_group(lo):
        return next(g for g in grp_ranges if g['from_'] == lo)
    # iterate with state machine
    i = 0
    pending_q = None
    gcur = None
    while i < len(body):
        t = body[i]
        if t[0] == 'p':
            txt = re.sub(r'\s+', ' ', ' '.join(x for x in t[1] if x)).strip()
            mm = re.match(r'^(I|II|III|IV)\.\s*(\d+)[–-](\d+)', txt)
            if mm: gcur = int(mm.group(2)); i += 1; continue
            L = [x for x in t[1]]
            mq = CAU.match(L[0].strip()) if L else None
            if mq:
                n = int(mq.group(1)); rest = [CAU.sub('', L[0].strip(), 1)] + L[1:]
                if gcur == 11:   # 11-15 "Hình ____"
                    add(n, group=gcur, questionType='match_image_bank', hanzi='', pinyin='')
                    Qs[n]['choices'] = []   # filled from bank below
                elif gcur == 16:
                    add(n, group=gcur, questionType='listen_dialog_choice')
                    # choices: next 3 paragraphs
                    ch = []
                    for j in range(1, 4):
                        pj = body[i+j]; assert pj[0]=='p', (eid, n)
                        Lj = pj[1]; mc = CH.match(Lj[0].strip())
                        label = mc.group(1); hz = CH.sub('', Lj[0].strip(), 1).strip(); py = (Lj[1].strip() if len(Lj)>1 else '')
                        ch.append(dict(label=label, hanzi=hz, pinyin=py))
                    Qs[n]['choices'] = ch; i += 3
                elif gcur == 6:
                    add(n, group=gcur, questionType='listen_pick_image')
                    pending_q = n
                elif gcur == 26:
                    hz, py = hz_py(rest)
                    add(n, group=gcur, questionType='read_pick_image', hanzi=hz, pinyin=py)
                    pending_q = n
                elif gcur in (31, 36):
                    qtype = 'read_match_answer' if gcur == 31 else 'read_fill_bank'
                    hz, py = hz_py(rest)
                    hz = strip_blank(hz); py = strip_blank(py)
                    add(n, group=gcur, questionType=qtype, hanzi=hz, pinyin=py)
                else:
                    warn(f"Đề {eid:02d}: câu {n} ngoài nhóm đã biết (gcur={gcur})")
        else:  # table
            rows = t[1]
            if gcur in (1, 21) and all(len(r) == 2 for r in rows):
                for r in rows:
                    L = r[1]['lines']
                    mq = CAU.match(L[0].strip())
                    n = int(mq.group(1))
                    L0 = CAU.sub('', L[0].strip(), 1)
                    if gcur == 1:
                        add(n, group=1, questionType='listen_tf_image', hanzi='', pinyin='')
                    else:
                        L1 = L[1].strip() if len(L) > 1 else ''
                        add(n, group=21, questionType='read_tf_image', hanzi=re.sub(r'\s*□.*$', '', L0).strip(), pinyin='')
                        # source puts hanzi/pinyin/mark either in separate lines or one line
                        full = ' '.join(L)
                        Qs[n]['_raw'] = full
                    Qs[n]['imageIds'] = r[0]['imgs']
                    Qs[n]['choices'] = [dict(label='T', text='Đúng'), dict(label='F', text='Sai')]
            elif gcur in (6, 26):
                cells = rows[0]
                Qs[pending_q]['choices'] = [dict(label='ABC'[ci], imageId=c['imgs'][0]) for ci, c in enumerate(cells)]
                for c in cells:
                    if len(c['imgs']) != 1: warn(f"Đề {eid:02d} câu {pending_q}: ô hình có {len(c['imgs'])} ảnh")
            elif gcur == 11:
                banks[11] = [dict(label='ABCDE'[ci], imageId=c['imgs'][0]) for ci, c in enumerate(rows[0])]
            elif gcur == 31:
                bk = []
                for r in rows:
                    s = r[0]['lines']; txt = re.sub(r'\s+', ' ', ' '.join(s)).strip()
                    mc = CH.match(txt); lab = mc.group(1); rest_ = CH.sub('', txt, 1)
                    # hanzi runs until first latin letter
                    mh = re.match(r'^([^A-Za-zĀ-ſ]*?)\s+([A-Za-zĀ-ſ].*)$', rest_)
                    bk.append(dict(label=lab, hanzi=mh.group(1).strip(), pinyin=mh.group(2).strip()) if mh else dict(label=lab, hanzi=rest_, pinyin=''))
                banks[31] = bk
            elif gcur == 36:
                bk = []
                for r in rows:
                    for c in r:
                        s = c['lines']; first = s[0].strip(); mc = CH.match(first)
                        lab = mc.group(1); hz = CH.sub('', first, 1).strip(); py = s[1].strip() if len(s) > 1 else ''
                        bk.append(dict(label=lab, hanzi=hz, pinyin=py))
                banks[36] = bk
        i += 1
    # attach banks
    for n, q in Qs.items():
        if q['questionType'] == 'match_image_bank': q['choices'] = banks[11]; q['bankGroup'] = 11
        if q['questionType'] == 'read_match_answer': q['choices'] = banks[31]; q['bankGroup'] = 31
        if q['questionType'] == 'read_fill_bank': q['choices'] = banks[36]; q['bankGroup'] = 36
    # fix reading TF (21-25): re-split hanzi/pinyin from raw
    for n in range(21, 26):
        q = Qs[n]; raw = q.pop('_raw')
        raw = re.sub(r'^Câu\s+\d+\.\s*', '', raw.strip())
        raw = re.sub(r'\s*□.*$', '', raw)
        m = re.match(r'^([^A-Za-z]*?[。？！])\s*(.*)$', raw)
        q['hanzi'], q['pinyin'] = (m.group(1).strip(), m.group(2).strip()) if m else (raw, '')
    # mark image usage
    for q in Qs.values():
        for iid in q['imageIds'] + [c.get('imageId') for c in q['choices'] if c.get('imageId')]:
            if iid: assets[iid]['usedBy'].append(f"{eid:02d}-{q['questionNumber']:02d}")
    exam = dict(examId=eid, title=title, group=group, lesson='Bài 9–10 MUSAN' if eid <= 3 else 'Tổng ôn Bài 6–10 MUSAN',
                groups=[dict(id=g['from_'], roman=g['roman'], from_=g['from_'], to=g['to'], instruction=g['instruction']) for g in grp_ranges],
                questions=[Qs[n] for n in sorted(Qs)])
    for g in exam['groups']: g['from'] = g.pop('from_')
    for g in exam['groups']: g['to'] = g.pop('to') if 'to' in g else g['to']
    exams.append(exam)
    audit['exams'][eid] = dict(questions=len(Qs), missing=[n for n in range(1, 41) if n not in Qs], groups=len(grp_ranges))

# ---- write JSON per exam
json_dir = os.path.join(ROOT, 'src/data')
for e in exams:
    json.dump(e, open(os.path.join(json_dir, f"exam{e['examId']:02d}.json"), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
json.dump(list(assets.values()), open(os.path.join(json_dir, 'assets.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

# ---- audit
used = {i for a in assets.values() for i in [a['id']] if a['usedBy']}
total_refs = sum(len(a['usedBy']) for a in assets.values())
with zipfile.ZipFile(SRC) as z: media = [n for n in z.namelist() if n.startswith('word/media/')]
lines_md = ["# Extraction audit", "", f"Nguồn: `{os.path.basename(SRC)}`", "",
 f"- Đề trích xuất: **{len(exams)}/6**", f"- Tổng câu: **{sum(len(e['questions']) for e in exams)}/240**",
 f"- File ảnh trong DOCX (word/media): **{len(media)}**; ảnh duy nhất (theo SHA-256): **{len(assets)}**",
 f"- Tham chiếu hình trong câu hỏi: **{total_refs}**; ảnh chưa dùng: **{len(assets)-len(used)}**",
 "- Drawing inline: 270; anchor/VML/textbox: 0 (đã kiểm tra bằng grep OOXML).", "",
 "## Theo đề", "", "| Đề | Câu | Nhóm | Câu thiếu |", "|---|---|---|---|"]
for eid, a in audit['exams'].items(): lines_md.append(f"| {eid:02d} | {a['questions']}/40 | {a['groups']}/8 | {a['missing'] or '-'} |")
lines_md += ["", "## Cảnh báo", ""] + ([f"- {w}" for w in audit['warnings']] or ["- Không có."])
lines_md += ["", "## Thành phần KHÔNG có trong Word (không bịa)", "",
 "- Đáp án đúng: không có → `correctAnswer = null`, `answerStatus = 'missing'`.",
 "- Lời nghe, nghĩa tiếng Việt, giải thích: không có (file Word riêng theo mục 5 của đề).",
 "- 6 file MP3: chưa được cung cấp.", "",
 "## Ghi chú nghi ngờ", "",
 "- Câu 21–25: Hán tự/Pinyin tách bằng dấu câu `。？！` vì nguồn nối hai dòng trong ô bảng; cần soát tay các câu nghi ngờ (xem JSON).",
 "- Hình là ký hiệu trực quan do tác giả đề tạo; ngữ nghĩa hình chưa được suy diễn."]
open(os.path.join(ROOT, 'extraction-audit.md'), 'w', encoding='utf-8').write('\n'.join(lines_md))
print('OK', {e['examId']: len(e['questions']) for e in exams}, 'unique imgs', len(assets), 'warnings', audit['warnings'])
