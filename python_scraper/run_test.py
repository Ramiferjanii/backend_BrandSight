
import subprocess
import json
import sys

cmd = [
    "python", "scraper.py", 
    "https://www.tunisianet.com.tn/301-pc-portable-tunisie", 
    "static", 
    "--maxPages", "5"
]

print("Running scraper...")
result = subprocess.run(cmd, capture_output=True, text=True)

print("STDERR:")
print(result.stderr)

if result.stdout:
    lines = result.stdout.strip().split('\n')
    for line in lines:
        if line.startswith('{"success"'):
            data = json.loads(line)
            items = data.get('data', {}).get('data', [])
            print(f"Total items: {len(items)}")
            if len(items) > 0:
                print(f"First 3 item prices: {[i.get('price') for i in items[:3]]}")
else:
    print("No STDOUT")
