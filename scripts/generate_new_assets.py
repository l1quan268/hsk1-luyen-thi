import math, os, sys
from PIL import Image, ImageDraw, ImageFont

sys.stdout.reconfigure(encoding='utf-8')

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS_DIR = os.path.join(ROOT, 'public/assets')
os.makedirs(ASSETS_DIR, exist_ok=True)

# Try loading a standard font
try:
    font_bold_large = ImageFont.truetype("arialbd.ttf", 36)
    font_bold_med = ImageFont.truetype("arialbd.ttf", 22)
    font_bold_small = ImageFont.truetype("arialbd.ttf", 16)
    font_bold_xs = ImageFont.truetype("arialbd.ttf", 12)
    font_zh = ImageFont.truetype("simsun.ttc", 20)
    font_zh_large = ImageFont.truetype("simhei.ttf", 26)
    font_zh_med = ImageFont.truetype("simhei.ttf", 18)
except Exception:
    font_bold_large = font_bold_med = font_bold_small = font_bold_xs = font_zh = font_zh_large = font_zh_med = ImageFont.load_default()

def create_base_card():
    im = Image.new("RGBA", (190, 176), (255, 255, 255, 255))
    draw = ImageDraw.Draw(im)
    # Rounded border like original
    draw.rounded_rectangle([3, 3, 186, 172], radius=16, outline=(186, 203, 201, 255), width=3)
    return im, draw

# =========================================================================
# 1. img40.png: Thầy giáo nam (Male Teacher in front of chalkboard)
# =========================================================================
def gen_img40():
    im, draw = create_base_card()
    
    # Blackboard in background
    board_rect = [22, 22, 168, 148]
    draw.rounded_rectangle(board_rect, radius=8, fill=(43, 94, 75, 255), outline=(139, 90, 43, 255), width=3)
    # Chalk text on board
    try:
        f_chalk = ImageFont.truetype("arial.ttf", 14)
    except:
        f_chalk = ImageFont.load_default()
    draw.text((32, 30), "ABC  1+1=2", fill=(210, 235, 225, 200), font=f_chalk)
    draw.line([(32, 48), (105, 48)], fill=(210, 235, 225, 160), width=1)
    
    # Male teacher in foreground (center-right)
    # Body / Suit jacket
    body_poly = [(55, 148), (70, 105), (120, 105), (135, 148)]
    draw.polygon(body_poly, fill=(50, 80, 120, 255))
    # White collar & red tie
    draw.polygon([(88, 105), (102, 105), (95, 120)], fill=(255, 255, 255, 255))
    draw.polygon([(93, 115), (97, 115), (99, 142), (95, 148), (91, 142)], fill=(210, 50, 45, 255))
    
    # Neck
    draw.rectangle([88, 95, 102, 106], fill=(255, 205, 148, 255))
    
    # Head / Face
    draw.ellipse([70, 45, 120, 98], fill=(255, 205, 148, 255))
    
    # Hair (male short dark hair)
    draw.chord([68, 38, 122, 75], 180, 360, fill=(60, 42, 30, 255))
    draw.pieslice([67, 40, 100, 75], 160, 260, fill=(60, 42, 30, 255))
    draw.pieslice([90, 40, 123, 75], 280, 20, fill=(60, 42, 30, 255))
    # Sideburns
    draw.rectangle([68, 55, 73, 75], fill=(60, 42, 30, 255))
    draw.rectangle([117, 55, 122, 75], fill=(60, 42, 30, 255))
    
    # Glasses
    draw.rounded_rectangle([76, 62, 92, 75], radius=2, outline=(40, 40, 40, 255), width=2)
    draw.rounded_rectangle([98, 62, 114, 75], radius=2, outline=(40, 40, 40, 255), width=2)
    draw.line([(92, 68), (98, 68)], fill=(40, 40, 40, 255), width=2)
    
    # Eyes behind glasses
    draw.ellipse([82, 66, 86, 70], fill=(40, 40, 40, 255))
    draw.ellipse([104, 66, 108, 70], fill=(40, 40, 40, 255))
    
    # Nose & gentle smile
    draw.arc([92, 72, 98, 80], 40, 140, fill=(200, 140, 90, 255), width=2)
    draw.arc([88, 82, 102, 90], 0, 180, fill=(160, 60, 50, 255), width=2)
    
    # Holding a book / pointer in hand
    draw.rectangle([125, 118, 155, 148], fill=(180, 40, 40, 255), outline=(140, 20, 20, 255), width=2)
    draw.rectangle([128, 120, 134, 146], fill=(245, 240, 230, 255))
    # Hand
    draw.ellipse([120, 126, 134, 140], fill=(255, 205, 148, 255))
    
    im.save(os.path.join(ASSETS_DIR, 'img40.png'), 'PNG')
    print("Generated img40.png (Thầy giáo nam)")

# =========================================================================
# 2. img41.png: Đúng 1 quyển sách (Single Book)
# =========================================================================
def gen_img41():
    im, draw = create_base_card()
    
    # Isometric single closed book (matching img21 perspective but single)
    # Book spine & front cover: Elegant Red
    # Top cover: polygon
    # Spine left: polygon
    # Pages front/bottom: white/light cream
    
    # Coordinate offsets for 1 big clear book
    cx, cy = 95, 88
    
    # Spine (left side)
    spine_poly = [(42, 68), (56, 52), (56, 110), (42, 126)]
    draw.polygon(spine_poly, fill=(185, 35, 35, 255), outline=(50, 50, 50, 255))
    
    # Top Cover (tilted red quadrilateral)
    top_poly = [(56, 52), (135, 78), (121, 136), (42, 110)]
    # adjust for isometric view
    top_poly = [(42, 68), (125, 42), (156, 92), (73, 118)]
    draw.polygon(top_poly, fill=(225, 55, 55, 255), outline=(50, 50, 50, 255))
    
    # Golden emblem / star on cover
    draw.ellipse([92, 70, 106, 84], fill=(255, 215, 0, 255), outline=(210, 160, 0, 255), width=1)
    
    # Pages block (right and bottom)
    pages_poly = [(156, 92), (156, 114), (73, 140), (73, 118)]
    draw.polygon(pages_poly, fill=(220, 240, 250, 255), outline=(50, 50, 50, 255))
    # Page lines
    for dy in [98, 104, 110]:
        draw.line([(154, dy), (75, dy + 26)], fill=(180, 205, 220, 255), width=1)
        
    bottom_spine = [(42, 68), (42, 90), (73, 140), (73, 118)]
    draw.polygon(bottom_spine, fill=(170, 30, 30, 255), outline=(50, 50, 50, 255))
    
    # Silk yellow bookmark ribbon hanging out
    ribbon = [(110, 128), (115, 148), (111, 144), (107, 148), (106, 129)]
    draw.polygon(ribbon, fill=(255, 200, 30, 255), outline=(180, 140, 20, 255))
    
    im.save(os.path.join(ASSETS_DIR, 'img41.png'), 'PNG')
    print("Generated img41.png (1 quyển sách)")

# =========================================================================
# 3. img42.png: 2 chú chó (Two Cute Dogs matching img06 style)
# =========================================================================
def gen_img42():
    im, draw = create_base_card()
    
    # In img06: Dog head is beige (255, 235, 205), brown ears (140, 90, 70), brown eye patch (200, 110, 60), black nose/eyes, pink tongue.
    # We will draw 2 cute dogs: Dog 1 on left, Dog 2 on right
    
    def draw_dog(offset_x, offset_y, scale=0.78, patch_right=True):
        # Ear 1 (left)
        ear_left = [offset_x - 32*scale, offset_y - 25*scale, offset_x - 10*scale, offset_y + 35*scale]
        draw.ellipse(ear_left, fill=(140, 90, 70, 255))
        # Ear 2 (right)
        ear_right = [offset_x + 10*scale, offset_y - 25*scale, offset_x + 32*scale, offset_y + 35*scale]
        draw.ellipse(ear_right, fill=(140, 90, 70, 255))
        
        # Head base (round)
        head_box = [offset_x - 28*scale, offset_y - 22*scale, offset_x + 28*scale, offset_y + 30*scale]
        draw.ellipse(head_box, fill=(255, 240, 215, 255))
        
        # Eye patch
        if patch_right:
            patch_box = [offset_x + 4*scale, offset_y - 12*scale, offset_x + 22*scale, offset_y + 12*scale]
            draw.ellipse(patch_box, fill=(205, 115, 75, 255))
        else:
            patch_box = [offset_x - 22*scale, offset_y - 12*scale, offset_x - 4*scale, offset_y + 12*scale]
            draw.ellipse(patch_box, fill=(205, 115, 75, 255))
            
        # Eyes
        draw.ellipse([offset_x - 15*scale, offset_y - 4*scale, offset_x - 7*scale, offset_y + 4*scale], fill=(30, 30, 30, 255))
        draw.ellipse([offset_x + 7*scale, offset_y - 4*scale, offset_x + 15*scale, offset_y + 4*scale], fill=(30, 30, 30, 255))
        
        # Nose
        draw.ellipse([offset_x - 7*scale, offset_y + 6*scale, offset_x + 7*scale, offset_y + 16*scale], fill=(30, 30, 30, 255))
        
        # Mouth & Tongue
        draw.arc([offset_x - 12*scale, offset_y + 10*scale, offset_x, offset_y + 22*scale], 0, 180, fill=(30, 30, 30, 255), width=2)
        draw.arc([offset_x, offset_y + 10*scale, offset_x + 12*scale, offset_y + 22*scale], 0, 180, fill=(30, 30, 30, 255), width=2)
        # Pink tongue
        draw.chord([offset_x - 5*scale, offset_y + 16*scale, offset_x + 5*scale, offset_y + 28*scale], 0, 180, fill=(245, 90, 130, 255))

    # Dog 1 (left)
    draw_dog(62, 92, scale=0.76, patch_right=False)
    # Dog 2 (right)
    draw_dog(128, 92, scale=0.76, patch_right=True)
    
    im.save(os.path.join(ASSETS_DIR, 'img42.png'), 'PNG')
    print("Generated img42.png (2 chú chó)")

# =========================================================================
# 4. img43.png: Nữ bác sĩ đeo ống nghe (Female Doctor)
# =========================================================================
def gen_img43():
    im, draw = create_base_card()
    
    # White doctor coat / body
    body_poly = [(50, 150), (66, 105), (124, 105), (140, 150)]
    draw.polygon(body_poly, fill=(240, 245, 250, 255), outline=(190, 205, 215, 255), width=2)
    # Inner light teal shirt
    draw.polygon([(85, 105), (105, 105), (95, 124)], fill=(120, 200, 200, 255))
    
    # Stethoscope around neck
    # rubber tube (bright blue)
    draw.arc([72, 102, 118, 142], 10, 170, fill=(0, 140, 230, 255), width=4)
    # metal bell chest piece
    draw.ellipse([98, 134, 114, 150], fill=(180, 190, 200, 255), outline=(0, 140, 230, 255), width=2)
    draw.ellipse([103, 139, 109, 145], fill=(220, 230, 240, 255))
    
    # Neck
    draw.rectangle([88, 92, 102, 106], fill=(255, 210, 155, 255))
    
    # Head / Face
    draw.ellipse([70, 42, 120, 96], fill=(255, 210, 155, 255))
    
    # Female hair (long dark brown hair, framing face)
    draw.chord([64, 32, 126, 75], 180, 360, fill=(75, 48, 38, 255))
    draw.pieslice([62, 35, 100, 75], 160, 250, fill=(75, 48, 38, 255))
    draw.pieslice([90, 35, 128, 75], 290, 20, fill=(75, 48, 38, 255))
    # Hair sides falling on shoulders
    draw.rounded_rectangle([62, 55, 74, 125], radius=6, fill=(75, 48, 38, 255))
    draw.rounded_rectangle([116, 55, 128, 125], radius=6, fill=(75, 48, 38, 255))
    
    # Eyes (friendly curved lashes)
    draw.ellipse([78, 65, 84, 71], fill=(45, 45, 45, 255))
    draw.ellipse([106, 65, 112, 71], fill=(45, 45, 45, 255))
    draw.arc([76, 60, 86, 68], 200, 340, fill=(75, 48, 38, 255), width=2)
    draw.arc([104, 60, 114, 68], 200, 340, fill=(75, 48, 38, 255), width=2)
    
    # Cheeks & Smile
    draw.ellipse([73, 73, 81, 79], fill=(255, 160, 160, 150))
    draw.ellipse([109, 73, 117, 79], fill=(255, 160, 160, 150))
    draw.arc([88, 77, 102, 87], 0, 180, fill=(200, 70, 70, 255), width=2)
    
    im.save(os.path.join(ASSETS_DIR, 'img43.png'), 'PNG')
    print("Generated img43.png (Nữ bác sĩ)")

# =========================================================================
# 5. img44.png: Lịch ghi rõ thứ Sáu FRI / 星期五 (Calendar Friday)
# =========================================================================
def gen_img44():
    im, draw = create_base_card()
    
    # Calendar body (matching img39)
    # White page with border
    cal_box = [38, 30, 152, 146]
    draw.rounded_rectangle(cal_box, radius=12, fill=(255, 255, 255, 255), outline=(180, 180, 180, 255), width=3)
    
    # Red top header
    header_box = [38, 30, 152, 74]
    draw.rounded_rectangle(header_box, radius=12, fill=(235, 60, 50, 255))
    draw.rectangle([38, 62, 152, 74], fill=(235, 60, 50, 255)) # straighten bottom
    
    # Two binder rings at top
    draw.ellipse([54, 22, 66, 38], fill=(255, 255, 255, 255), outline=(200, 200, 200, 255), width=2)
    draw.ellipse([124, 22, 136, 38], fill=(255, 255, 255, 255), outline=(200, 200, 200, 255), width=2)
    
    # Text on red header: "FRI 星期五"
    try:
        f_head = ImageFont.truetype("arialbd.ttf", 16)
        f_zh_sub = ImageFont.truetype("simhei.ttf", 15)
    except:
        f_head = f_zh_sub = ImageFont.load_default()
    
    draw.text((95, 52), "FRI 星期五", fill=(255, 255, 255, 255), font=f_head, anchor="mm")
    
    # Big date "17" in calendar body
    try:
        f_num = ImageFont.truetype("arialbd.ttf", 48)
    except:
        f_num = ImageFont.load_default()
    draw.text((95, 110), "17", fill=(25, 25, 25, 255), font=f_num, anchor="mm")
    
    im.save(os.path.join(ASSETS_DIR, 'img44.png'), 'PNG')
    print("Generated img44.png (Lịch thứ Sáu FRI / 星期五)")

# =========================================================================
# 6. img45.png: Bánh sinh nhật có ghi rõ 8月17日 (Birthday Cake Aug 17)
# =========================================================================
def gen_img45():
    im, draw = create_base_card()
    
    # Cake base (bottom sponge layer)
    draw.rounded_rectangle([42, 85, 148, 142], radius=14, fill=(255, 195, 115, 255))
    # Cream frosting top layer
    draw.rounded_rectangle([38, 70, 152, 105], radius=12, fill=(255, 252, 240, 255), outline=(245, 230, 200, 255), width=1)
    # Strawberries on cake top
    for sx in [52, 74, 95, 116, 138]:
        draw.ellipse([sx - 8, 62, sx + 8, 78], fill=(235, 60, 50, 255))
        draw.polygon([(sx - 4, 63), (sx + 4, 63), (sx, 58)], fill=(50, 160, 50, 255))
    
    # 3 Candles with flames
    for cx, c_color in [(72, (100, 190, 240, 255)), (95, (245, 130, 190, 255)), (118, (140, 110, 230, 255))]:
        draw.rectangle([cx - 3, 40, cx + 3, 64], fill=c_color)
        # Flame
        draw.ellipse([cx - 4, 26, cx + 4, 38], fill=(255, 170, 0, 255))
        draw.ellipse([cx - 2, 29, cx + 2, 36], fill=(255, 235, 50, 255))
        
    # Beautiful golden/chocolate decorative banner across cake: "8月17日"
    banner_box = [48, 108, 142, 136]
    draw.rounded_rectangle(banner_box, radius=6, fill=(110, 55, 30, 255), outline=(255, 215, 0, 255), width=2)
    try:
        f_date = ImageFont.truetype("simhei.ttf", 16)
    except:
        try:
            f_date = ImageFont.truetype("arialbd.ttf", 16)
        except:
            f_date = ImageFont.load_default()
    draw.text((95, 122), "8月17日", fill=(255, 235, 160, 255), font=f_date, anchor="mm")
    
    im.save(os.path.join(ASSETS_DIR, 'img45.png'), 'PNG')
    print("Generated img45.png (Bánh sinh nhật 8月17日)")

gen_img40()
gen_img41()
gen_img42()
gen_img43()
gen_img44()
gen_img45()
