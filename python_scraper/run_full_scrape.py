
import subprocess
import json
import sys

cmd = [
    "python", "scraper.py", 
    "https://www.tunisianet.com.tn/301-pc-portable-tunisie", 
    "static", 
    "--minPrice", "1100", 
    "--maxPrice", "1200", 
    "--maxPages", "20"
]

print(f"Running: {' '.join(cmd)}")
process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, encoding='utf-8')

while True:
    stderr_line = process.stderr.readline()
    if stderr_line:
        print(f"STDERR: {stderr_line.strip()}", file=sys.stderr)
    
    if process.poll() is not None:
        break

stdout, stderr = process.communicate()
if stderr:
    for line in stderr.splitlines():
        print(f"STDERR: {line.strip()}", file=sys.stderr)

if stdout:
    lines = stdout.strip().split('\n')
    for line in lines:
        if line.startswith('{"success"'):
            data = json.loads(line)
            items = data.get('data', {}).get('data', [])
            print(f"DONE! Total items matching criteria: {len(items)}")
            for item in items:
                print(f"- {item.get('name')}: {item.get('price')}")
