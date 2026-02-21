
import json
import subprocess

cmd = [
    "python", "scraper.py", 
    "https://www.tunisianet.com.tn/301-pc-portable-tunisie", 
    "static", 
    "--minPrice", "1100", 
    "--maxPrice", "1200", 
    "--maxPages", "3"
]

result = subprocess.run(cmd, capture_output=True, text=True)
if result.stdout:
    # Find the last line which is the JSON
    lines = result.stdout.strip().split('\n')
    json_str = ""
    for line in reversed(lines):
        if line.strip().startswith('{"success":'):
            json_str = line
            break
    
    if json_str:
        data = json.loads(json_str)
        items = data.get("data", {}).get("data", [])
        print(f"Found {len(items)} products:")
        for idx, item in enumerate(items):
            print(f"{idx+1}. {item.get('name')} - {item.get('price')}")
    else:
        print("No JSON found in output")
        print("STDOUT:", result.stdout)
        print("STDERR:", result.stderr)
else:
    print("No output from scraper")
    print("STDERR:", result.stderr)
