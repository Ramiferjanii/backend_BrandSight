
import json
import os

filepath = 'final_results.json'
# Try different encodings
encodings = ['utf-16', 'utf-8', 'latin-1']
data = None

for enc in encodings:
    try:
        with open(filepath, 'r', encoding=enc) as f:
            content = f.read().strip()
            # The JSON starts after the "Using Static Scraper..." line
            # It's the last line in the output
            lines = content.split('\n')
            for line in reversed(lines):
                line = line.strip()
                if line.startswith('{"success"'):
                    data = json.loads(line)
                    break
            if data:
                break
    except Exception:
        continue

if data:
    items = data.get('data', {}).get('data', [])
    print(f"Total items found: {len(items)}")
    
    filtered = [i for i in items if i.get('priceAmount') and 1100 <= i.get('priceAmount') <= 1200]
    
    print(f"Products between 1100 and 1200 DT on the first 3 pages:")
    if not filtered:
        print("None found in this specific price range on the first 3 pages.")
        # Show some example prices to confirm it's working
        print("\nPage 1-3 Price Examples:")
        for idx, item in enumerate(items[:5]):
            print(f"- {item.get('name')}: {item.get('price')} (Amt: {item.get('priceAmount')})")
    else:
        for idx, item in enumerate(filtered):
            print(f"{idx+1}. {item.get('name')} - {item.get('price')}")
            print(f"   Link: {item.get('url')}")
else:
    print("Could not parse JSON from results.")
