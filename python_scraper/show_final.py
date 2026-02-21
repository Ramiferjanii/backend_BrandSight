
import json

# PowerShell redirection often uses UTF-16
try:
    with open('price_sorted.json', 'r', encoding='utf-16') as f:
        text = f.read().strip()
except Exception as e:
    with open('price_sorted.json', 'r', encoding='utf-8') as f:
        text = f.read().strip()


print(f"Text length: {len(text)}")
if len(text) > 0:
    print(f"First 100 chars: {text[:100]}")


    # Find the JSON part
    lines = text.split('\n')
    json_str = ""
    for line in reversed(lines):
        if line.strip().startswith('{"success":'):
            json_str = line
            break
            
    if json_str:
        data = json.loads(json_str)
        items = data.get("data", {}).get("data", [])
        
        filtered = [i for i in items if i.get('priceAmount') and 1100 <= i.get('priceAmount') <= 1200]
        
        print(f"Total items scraped: {len(items)}")
        print(f"Items between 1100 and 1200 DT: {len(filtered)}")
        for idx, item in enumerate(items):
             print(f"{idx+1}. {item.get('name')} - {item.get('price')} (Amt: {item.get('priceAmount')})")
        
        for idx, item in enumerate(filtered):
            print(f"MATCH: {item.get('name')} - {item.get('price')}")

    else:
        print("No JSON found")
