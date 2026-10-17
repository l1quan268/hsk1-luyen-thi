import os, docx, json
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

for i in range(1, 40):
    fn = f"img{i:02d}.png"
    p = os.path.join(ROOT, 'public/assets', fn)
    if os.path.exists(p):
        im = Image.open(p)
        print(f"img{i:02d}: size={im.size}, mode={im.mode}")
