import json, sys
sys.stdout.reconfigure(encoding='utf-8')

with open('src/data/assets.json', 'r', encoding='utf-8') as f:
    assets = json.load(f)

for a in assets:
    iid = a['id']
    fn = a['file']
    print(f"{iid}: {fn}")
