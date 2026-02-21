
import json

try:
    with open('page10.json', 'r', encoding='utf-16') as f:
        content = f.read()
except:
    with open('page10.json', 'r', encoding='utf-8') as f:
        content = f.read()

lines = content.split('\n')
for line in reversed(lines):
    if line.strip().startswith('{"success"'):
        data = json.loads(line)
        items = data.get('data', {}).get('data', [])
        print(f"Items found: {len(items)}")
        for i in items:
            print(f"- {i.get('name')}: {i.get('price')} (Amt: {i.get('priceAmount')})")
        break
