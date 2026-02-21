
import urllib.parse

last_url = "https://www.tunisianet.com.tn/301-pc-portable-tunisie?page=2"
next_href = "?page=3"
joined = urllib.parse.urljoin(last_url, next_href)
print(f"Joined: {joined}")

parsed_current = urllib.parse.urlparse(last_url)
current_params = urllib.parse.parse_qs(parsed_current.query)
next_params = urllib.parse.parse_qs(next_href[1:])
merged_params = current_params.copy()
for k, v in next_params.items():
    merged_params[k] = v
new_query = urllib.parse.urlencode(merged_params, doseq=True)
current_url = parsed_current._replace(query=new_query).geturl()
print(f"Merged: {current_url}")
