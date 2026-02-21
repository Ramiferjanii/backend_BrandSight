
import requests
from bs4 import BeautifulSoup

url = "https://www.tunisianet.com.tn/301-pc-portable-tunisie?page=2"
headers = {'User-Agent': 'Mozilla/5.0'}
response = requests.get(url, headers=headers)
soup = BeautifulSoup(response.text, 'html.parser')

pagination = soup.select('.pagination')
if pagination:
    print("Pagination found:")
    print(pagination[0].prettify())
else:
    print("Pagination NOT found")

next_button = soup.select('a.next')
print(f"Next button (a.next): {next_button}")

# Check if there are products
products = soup.select('.product-miniature')
print(f"Products: {len(products)}")
