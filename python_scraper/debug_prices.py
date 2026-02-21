
import json
import subprocess

cmd = [
    "python", "scraper.py", 
    "https://www.tunisianet.com.tn/301-pc-portable-tunisie", 
    "static", 
    "--maxPages", "1"
]

result = subprocess.run(cmd, capture_output=True, text=True)
if result.stdout:
    lines = result.stdout.strip().split('\n')
    json_str = ""
    for line in reversed(lines):
        if line.strip().startswith('{"success":'):
            json_str = line
            break
    
        data = json.loads(json_str)
        items = data.get("data", {}).get("data", [])
        print(f"Total items on page 1: {len(items)}")
        for idx, item in enumerate(items):
            print(f"{idx+1}. {item.get('name')} - {item.get('price')} (Amount: {item.get('priceAmount')})")

    else:
        print("No JSON found")
else:
    print("No output")
