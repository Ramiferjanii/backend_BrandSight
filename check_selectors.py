
import requests
from bs4 import BeautifulSoup

url = "https://www.tunisianet.com.tn/301-pc-portable-tunisie"
headers = {'User-Agent': 'Mozilla/5.0'}
response = requests.get(url, headers=headers)
soup = BeautifulSoup(response.text, 'html.parser')

# Find next button
next_btn = soup.select_one('a.next')
print(f"Next Button (a.next): {next_btn}")

next_btn_alt = soup.select_one('.pagination a.next')
print(f"Next Button (.pagination a.next): {next_btn_alt}")

# Find products
products = soup.select('.product-miniature')
print(f"Products count (.product-miniature): {len(products)}")

if products:
    p = products[0]
    print(f"First product name selector (.product-title a): {p.select_one('.product-title a').get_text(strip=True)}")
    print(f"First product price selector (.price): {p.select_one('.price').get_text(strip=True)}")
