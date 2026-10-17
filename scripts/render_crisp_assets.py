import os, sys
from PIL import Image, ImageDraw, ImageFont

sys.stdout.reconfigure(encoding='utf-8')

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS_DIR = os.path.join(ROOT, 'public/assets')

SCALE = 4
W, H = 190 * SCALE, 176 * SCALE

def get_font(size, bold=True):
    try:
        font_path = 'C:/Windows/Fonts/msyhbd.ttc' if bold else 'C:/Windows/Fonts/msyh.ttc'
        return ImageFont.truetype(font_path, size * SCALE)
    except:
        try:
            return ImageFont.truetype('C:/Windows/Fonts/arialbd.ttf', size * SCALE)
        except:
            return ImageFont.load_default()

def new_card():
    im = Image.new("RGBA", (W, H), (255, 255, 255, 255))
    draw = ImageDraw.Draw(im)
    # Rounded border matching original: 3px stroke, radius 16px
    pad = 3 * SCALE
    r = 16 * SCALE
    draw.rounded_rectangle([pad, pad, W - pad, H - pad], radius=r, outline=(186, 203, 201, 255), width=3 * SCALE)
    return im, draw

def save_card(im, name):
    im_final = im.resize((190, 176), Image.Resampling.LANCZOS)
    im_final.save(os.path.join(ASSETS_DIR, name), 'PNG')
    print(f"Generated {name} (supersampled 4x)")

# =========================================================================
# 1. img40.png: Thầy giáo nam (Male teacher with chalkboard)
# =========================================================================
def make_img40():
    im, draw = new_card()
    
    # Blackboard
    b_left, b_top, b_right, b_bottom = 20 * SCALE, 18 * SCALE, 170 * SCALE, 150 * SCALE
    draw.rounded_rectangle([b_left, b_top, b_right, b_bottom], radius=10 * SCALE, fill=(38, 88, 70, 255), outline=(130, 85, 40, 255), width=3 * SCALE)
    
    # Chalk text on board
    f_chalk = get_font(12, bold=False)
    draw.text((32 * SCALE, 26 * SCALE), "A B C   1 + 1 = 2", fill=(215, 240, 230, 180), font=f_chalk)
    draw.line([(32 * SCALE, 44 * SCALE), (110 * SCALE, 44 * SCALE)], fill=(215, 240, 230, 150), width=1 * SCALE)
    
    # Male teacher centered
    # Body (navy suit)
    body = [
        (55 * SCALE, 150 * SCALE),
        (72 * SCALE, 102 * SCALE),
        (118 * SCALE, 102 * SCALE),
        (135 * SCALE, 150 * SCALE)
    ]
    draw.polygon(body, fill=(48, 78, 118, 255))
    
    # White collar
    draw.polygon([(88 * SCALE, 102 * SCALE), (102 * SCALE, 102 * SCALE), (95 * SCALE, 118 * SCALE)], fill=(255, 255, 255, 255))
    # Red tie
    tie = [
        (92 * SCALE, 114 * SCALE),
        (98 * SCALE, 114 * SCALE),
        (100 * SCALE, 142 * SCALE),
        (95 * SCALE, 148 * SCALE),
        (90 * SCALE, 142 * SCALE)
    ]
    draw.polygon(tie, fill=(215, 45, 40, 255))
    
    # Neck
    draw.rectangle([88 * SCALE, 90 * SCALE, 102 * SCALE, 103 * SCALE], fill=(255, 210, 150, 255))
    
    # Head (face)
    draw.ellipse([68 * SCALE, 38 * SCALE, 122 * SCALE, 94 * SCALE], fill=(255, 210, 150, 255))
    
    # Male short dark brown hair
    draw.chord([66 * SCALE, 30 * SCALE, 124 * SCALE, 74 * SCALE], 180, 360, fill=(55, 38, 28, 255))
    draw.pieslice([64 * SCALE, 34 * SCALE, 100 * SCALE, 76 * SCALE], 160, 260, fill=(55, 38, 28, 255))
    draw.pieslice([90 * SCALE, 34 * SCALE, 126 * SCALE, 76 * SCALE], 280, 20, fill=(55, 38, 28, 255))
    draw.rectangle([66 * SCALE, 52 * SCALE, 72 * SCALE, 72 * SCALE], fill=(55, 38, 28, 255))
    draw.rectangle([118 * SCALE, 52 * SCALE, 124 * SCALE, 72 * SCALE], fill=(55, 38, 28, 255))
    
    # Black stylish glasses
    g_w = 2 * SCALE
    draw.rounded_rectangle([74 * SCALE, 58 * SCALE, 92 * SCALE, 72 * SCALE], radius=2 * SCALE, outline=(30, 30, 30, 255), width=g_w)
    draw.rounded_rectangle([98 * SCALE, 58 * SCALE, 116 * SCALE, 72 * SCALE], radius=2 * SCALE, outline=(30, 30, 30, 255), width=g_w)
    draw.line([(92 * SCALE, 64 * SCALE), (98 * SCALE, 64 * SCALE)], fill=(30, 30, 30, 255), width=g_w)
    
    # Eyes
    draw.ellipse([81 * SCALE, 63 * SCALE, 85 * SCALE, 67 * SCALE], fill=(30, 30, 30, 255))
    draw.ellipse([105 * SCALE, 63 * SCALE, 109 * SCALE, 67 * SCALE], fill=(30, 30, 30, 255))
    
    # Nose & Smile
    draw.arc([91 * SCALE, 70 * SCALE, 99 * SCALE, 78 * SCALE], 30, 150, fill=(190, 130, 80, 255), width=2 * SCALE)
    draw.arc([87 * SCALE, 78 * SCALE, 103 * SCALE, 87 * SCALE], 0, 180, fill=(160, 50, 40, 255), width=2 * SCALE)
    
    # Red book in hand
    draw.rounded_rectangle([122 * SCALE, 114 * SCALE, 152 * SCALE, 148 * SCALE], radius=3 * SCALE, fill=(190, 35, 35, 255), outline=(130, 20, 20, 255), width=2 * SCALE)
    draw.rectangle([125 * SCALE, 117 * SCALE, 131 * SCALE, 145 * SCALE], fill=(245, 240, 230, 255))
    # Hand
    draw.ellipse([118 * SCALE, 124 * SCALE, 132 * SCALE, 140 * SCALE], fill=(255, 210, 150, 255))
    
    save_card(im, 'img40.png')

# =========================================================================
# 2. img41.png: Đúng 1 quyển sách (Single Book)
# =========================================================================
def make_img41():
    im, draw = new_card()
    
    # Isometric single book centered, matching img21 style
    # Top cover: quadrilateral
    p_top_l = (40 * SCALE, 72 * SCALE)
    p_top_t = (116 * SCALE, 44 * SCALE)
    p_top_r = (156 * SCALE, 84 * SCALE)
    p_top_b = (80 * SCALE, 112 * SCALE)
    
    # Book spine & pages thickness dy = 26 * SCALE
    dy = 24 * SCALE
    
    # Left spine polygon
    spine = [p_top_l, (p_top_l[0], p_top_l[1] + dy), (p_top_b[0], p_top_b[1] + dy), p_top_b]
    draw.polygon(spine, fill=(175, 28, 28, 255), outline=(45, 45, 45, 255))
    
    # Front/right pages block
    pages = [p_top_b, (p_top_b[0], p_top_b[1] + dy), (p_top_r[0], p_top_r[1] + dy), p_top_r]
    draw.polygon(pages, fill=(225, 242, 250, 255), outline=(45, 45, 45, 255))
    
    # Top cover
    draw.polygon([p_top_l, p_top_t, p_top_r, p_top_b], fill=(230, 52, 52, 255), outline=(45, 45, 45, 255))
    
    # Decorative gold lines & star on cover
    draw.line([((p_top_l[0]*3 + p_top_t[0])//4, (p_top_l[1]*3 + p_top_t[1])//4),
               ((p_top_b[0]*3 + p_top_r[0])//4, (p_top_b[1]*3 + p_top_r[1])//4)],
              fill=(190, 30, 30, 255), width=2 * SCALE)
    
    # Center gold star/circle
    cx = (p_top_l[0] + p_top_t[0] + p_top_r[0] + p_top_b[0]) // 4
    cy = (p_top_l[1] + p_top_t[1] + p_top_r[1] + p_top_b[1]) // 4
    draw.ellipse([cx - 8 * SCALE, cy - 8 * SCALE, cx + 8 * SCALE, cy + 8 * SCALE], fill=(255, 215, 0, 255), outline=(210, 160, 0, 255), width=1 * SCALE)
    
    # Page edge lines (soft blue/gray)
    for i in [6, 12, 18]:
        y_off = i * SCALE
        draw.line([(p_top_b[0], p_top_b[1] + y_off), (p_top_r[0], p_top_r[1] + y_off)], fill=(185, 210, 225, 255), width=1 * SCALE)
        
    # Yellow bookmark ribbon hanging out
    rx, ry = 112 * SCALE, 100 * SCALE
    ribbon = [
        (rx, ry),
        (rx + 8 * SCALE, ry + 36 * SCALE),
        (rx + 3 * SCALE, ry + 32 * SCALE),
        (rx - 2 * SCALE, ry + 36 * SCALE),
        (rx - 6 * SCALE, ry)
    ]
    draw.polygon(ribbon, fill=(255, 205, 35, 255), outline=(190, 145, 20, 255))
    
    save_card(im, 'img41.png')

# =========================================================================
# 3. img42.png: 2 chú chó (Two Cute Dogs matching img06 style)
# =========================================================================
def make_img42():
    im, draw = new_card()
    
    def draw_dog(cx, cy, s=0.76, patch_right=True):
        # Ears hanging naturally downward
        ew, eh = 13 * s * SCALE, 26 * s * SCALE
        # left ear
        draw.ellipse([cx - 24 * s * SCALE - ew, cy - 6 * s * SCALE, cx - 24 * s * SCALE + ew, cy - 6 * s * SCALE + eh * 2], fill=(142, 88, 68, 255))
        # right ear
        draw.ellipse([cx + 24 * s * SCALE - ew, cy - 6 * s * SCALE, cx + 24 * s * SCALE + ew, cy - 6 * s * SCALE + eh * 2], fill=(142, 88, 68, 255))
        
        # Face base
        rf = 28 * s * SCALE
        draw.ellipse([cx - rf, cy - rf, cx + rf, cy + rf + 4 * s * SCALE], fill=(255, 240, 218, 255))
        
        # Patch around one eye
        px = cx + 13 * s * SCALE if patch_right else cx - 13 * s * SCALE
        py = cy - 2 * s * SCALE
        draw.ellipse([px - 13 * s * SCALE, py - 13 * s * SCALE, px + 13 * s * SCALE, py + 13 * s * SCALE], fill=(205, 115, 75, 255))
        
        # Eyes
        eye_y = cy - 2 * s * SCALE
        draw.ellipse([cx - 14 * s * SCALE, eye_y - 5 * s * SCALE, cx - 6 * s * SCALE, eye_y + 5 * s * SCALE], fill=(42, 42, 42, 255))
        draw.ellipse([cx + 6 * s * SCALE, eye_y - 5 * s * SCALE, cx + 14 * s * SCALE, eye_y + 5 * s * SCALE], fill=(42, 42, 42, 255))
        
        # Nose
        draw.ellipse([cx - 7 * s * SCALE, cy + 7 * s * SCALE, cx + 7 * s * SCALE, cy + 17 * s * SCALE], fill=(30, 30, 30, 255))
        
        # Mouth
        draw.arc([cx - 12 * s * SCALE, cy + 10 * s * SCALE, cx, cy + 24 * s * SCALE], 0, 180, fill=(30, 30, 30, 255), width=2 * SCALE)
        draw.arc([cx, cy + 10 * s * SCALE, cx + 12 * s * SCALE, cy + 24 * s * SCALE], 0, 180, fill=(30, 30, 30, 255), width=2 * SCALE)
        # Pink tongue
        draw.chord([cx - 5 * s * SCALE, cy + 18 * s * SCALE, cx + 5 * s * SCALE, cy + 30 * s * SCALE], 0, 180, fill=(245, 95, 135, 255))

    # Two dogs nicely framed side-by-side with clear separation
    draw_dog(56 * SCALE, 90 * SCALE, s=0.82, patch_right=False)
    draw_dog(134 * SCALE, 90 * SCALE, s=0.82, patch_right=True)
    
    save_card(im, 'img42.png')

# =========================================================================
# 4. img43.png: Nữ bác sĩ đeo ống nghe (Female Doctor)
# =========================================================================
def make_img43():
    im, draw = new_card()
    
    # White doctor coat
    body = [
        (46 * SCALE, 154 * SCALE),
        (66 * SCALE, 102 * SCALE),
        (124 * SCALE, 102 * SCALE),
        (144 * SCALE, 154 * SCALE)
    ]
    draw.polygon(body, fill=(242, 246, 250, 255), outline=(195, 210, 220, 255), width=2 * SCALE)
    # Inner light teal scrub shirt
    draw.polygon([(84 * SCALE, 102 * SCALE), (106 * SCALE, 102 * SCALE), (95 * SCALE, 126 * SCALE)], fill=(105, 195, 195, 255))
    
    # Stethoscope tube around neck
    draw.arc([70 * SCALE, 98 * SCALE, 120 * SCALE, 142 * SCALE], 10, 170, fill=(0, 145, 235, 255), width=4 * SCALE)
    # Stethoscope chest piece
    draw.ellipse([98 * SCALE, 134 * SCALE, 114 * SCALE, 150 * SCALE], fill=(185, 195, 205, 255), outline=(0, 145, 235, 255), width=2 * SCALE)
    draw.ellipse([102 * SCALE, 138 * SCALE, 110 * SCALE, 146 * SCALE], fill=(225, 235, 245, 255))
    
    # Neck
    draw.rectangle([87 * SCALE, 88 * SCALE, 103 * SCALE, 103 * SCALE], fill=(255, 212, 158, 255))
    
    # Head / Face
    draw.ellipse([68 * SCALE, 36 * SCALE, 122 * SCALE, 94 * SCALE], fill=(255, 212, 158, 255))
    
    # Female long brown hair
    draw.chord([64 * SCALE, 26 * SCALE, 126 * SCALE, 74 * SCALE], 180, 360, fill=(78, 48, 38, 255))
    draw.pieslice([62 * SCALE, 30 * SCALE, 102 * SCALE, 74 * SCALE], 160, 250, fill=(78, 48, 38, 255))
    draw.pieslice([88 * SCALE, 30 * SCALE, 128 * SCALE, 74 * SCALE], 290, 20, fill=(78, 48, 38, 255))
    # Hair framing cheeks and shoulders
    draw.rounded_rectangle([60 * SCALE, 52 * SCALE, 73 * SCALE, 128 * SCALE], radius=6 * SCALE, fill=(78, 48, 38, 255))
    draw.rounded_rectangle([117 * SCALE, 52 * SCALE, 130 * SCALE, 128 * SCALE], radius=6 * SCALE, fill=(78, 48, 38, 255))
    
    # Eyes & Eyebrows
    draw.ellipse([78 * SCALE, 62 * SCALE, 85 * SCALE, 69 * SCALE], fill=(42, 42, 42, 255))
    draw.ellipse([105 * SCALE, 62 * SCALE, 112 * SCALE, 69 * SCALE], fill=(42, 42, 42, 255))
    draw.arc([76 * SCALE, 55 * SCALE, 87 * SCALE, 64 * SCALE], 200, 340, fill=(78, 48, 38, 255), width=2 * SCALE)
    draw.arc([103 * SCALE, 55 * SCALE, 114 * SCALE, 64 * SCALE], 200, 340, fill=(78, 48, 38, 255), width=2 * SCALE)
    
    # Rosy cheeks & smile
    draw.ellipse([72 * SCALE, 70 * SCALE, 80 * SCALE, 77 * SCALE], fill=(255, 155, 155, 140))
    draw.ellipse([110 * SCALE, 70 * SCALE, 118 * SCALE, 77 * SCALE], fill=(255, 155, 155, 140))
    draw.arc([88 * SCALE, 74 * SCALE, 102 * SCALE, 84 * SCALE], 0, 180, fill=(195, 65, 65, 255), width=2 * SCALE)
    
    save_card(im, 'img43.png')

# =========================================================================
# 5. img44.png: Lịch ghi rõ thứ Sáu FRI / 星期五 (Calendar Friday)
# =========================================================================
def make_img44():
    im, draw = new_card()
    
    # Calendar body (matching img39)
    cal_box = [36 * SCALE, 26 * SCALE, 154 * SCALE, 150 * SCALE]
    draw.rounded_rectangle(cal_box, radius=12 * SCALE, fill=(255, 255, 255, 255), outline=(180, 190, 195, 255), width=3 * SCALE)
    
    # Red top header
    header_box = [36 * SCALE, 26 * SCALE, 154 * SCALE, 75 * SCALE]
    draw.rounded_rectangle(header_box, radius=12 * SCALE, fill=(235, 55, 48, 255))
    draw.rectangle([36 * SCALE, 60 * SCALE, 154 * SCALE, 75 * SCALE], fill=(235, 55, 48, 255))
    
    # Two binder rings
    draw.ellipse([54 * SCALE, 16 * SCALE, 68 * SCALE, 34 * SCALE], fill=(255, 255, 255, 255), outline=(195, 205, 210, 255), width=2 * SCALE)
    draw.ellipse([122 * SCALE, 16 * SCALE, 136 * SCALE, 34 * SCALE], fill=(255, 255, 255, 255), outline=(195, 205, 210, 255), width=2 * SCALE)
    
    # Text on red header: "FRI 星期五"
    f_fri = get_font(18, bold=True)
    draw.text((95 * SCALE, 50 * SCALE), "FRI  星期五", fill=(255, 255, 255, 255), font=f_fri, anchor="mm")
    
    # Big date "17" in body
    f_num = get_font(52, bold=True)
    draw.text((95 * SCALE, 112 * SCALE), "17", fill=(30, 30, 30, 255), font=f_num, anchor="mm")
    
    save_card(im, 'img44.png')

# =========================================================================
# 6. img45.png: Bánh sinh nhật có ghi rõ 8月17日 (Birthday Cake Aug 17)
# =========================================================================
def make_img45():
    im, draw = new_card()
    
    # Cake base
    draw.rounded_rectangle([38 * SCALE, 82 * SCALE, 152 * SCALE, 144 * SCALE], radius=14 * SCALE, fill=(255, 195, 115, 255))
    # Cream frosting top layer
    draw.rounded_rectangle([34 * SCALE, 66 * SCALE, 156 * SCALE, 104 * SCALE], radius=12 * SCALE, fill=(255, 252, 240, 255), outline=(245, 230, 200, 255), width=1 * SCALE)
    
    # Strawberries on cake top
    for sx in [48, 71, 95, 119, 142]:
        x = sx * SCALE
        draw.ellipse([x - 8 * SCALE, 56 * SCALE, x + 8 * SCALE, 74 * SCALE], fill=(235, 55, 45, 255))
        draw.polygon([(x - 4 * SCALE, 58 * SCALE), (x + 4 * SCALE, 58 * SCALE), (x, 52 * SCALE)], fill=(45, 160, 45, 255))
    
    # 3 Candles
    for cx, col in [(70 * SCALE, (95, 185, 240, 255)), (95 * SCALE, (245, 125, 185, 255)), (120 * SCALE, (145, 115, 235, 255))]:
        draw.rectangle([cx - 3 * SCALE, 34 * SCALE, cx + 3 * SCALE, 60 * SCALE], fill=col)
        # Flame
        draw.ellipse([cx - 4 * SCALE, 20 * SCALE, cx + 4 * SCALE, 32 * SCALE], fill=(255, 170, 0, 255))
        draw.ellipse([cx - 2 * SCALE, 23 * SCALE, cx + 2 * SCALE, 30 * SCALE], fill=(255, 235, 45, 255))
        
    # Chocolate plaque with gold border reading "8月17日"
    banner_box = [46 * SCALE, 104 * SCALE, 144 * SCALE, 134 * SCALE]
    draw.rounded_rectangle(banner_box, radius=6 * SCALE, fill=(105, 52, 28, 255), outline=(255, 215, 0, 255), width=2 * SCALE)
    
    f_date = get_font(18, bold=True)
    draw.text((95 * SCALE, 119 * SCALE), "8月17日", fill=(255, 235, 160, 255), font=f_date, anchor="mm")
    
    save_card(im, 'img45.png')

make_img40()
make_img41()
make_img42()
make_img43()
make_img44()
make_img45()
