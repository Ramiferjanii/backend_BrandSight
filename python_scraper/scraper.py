import sys
import json
import time
import requests
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
from pymongo import MongoClient
from bson import ObjectId
import datetime
import urllib.parse

# Configuration
MONGO_URI = "mongodb://127.0.0.1:27017/express-demo"

SITE_CONFIGS = {
    "tunisianet.com.tn": {
        "name": ["h1", "h1.page-title"],
        "price": ["span[itemprop='price']", ".current-price span", "span.price"],
        "reference": [".product-reference span", "span.editable"],
        "overview": ["#description", ".product-description", ".product-information"],
        "category": [".breadcrumb", "nav.breadcrumb"]
    },
    "mytek.tn": {
        "name": ["h1", "span.base"],
        "price": ["span.price", ".price-wrapper span.price"],
        "reference": ["div[itemprop='sku']", ".sku span"],
        "overview": [".product.attribute.overview", ".product-item-details", "#description"],
        "category": [".breadcrumbs", "ul.items"]
    },
    "wiki.tn": {
        "name": ["h1.product_title", "h1"],
        "price": [".price span.woocommerce-Price-amount", ".price", ".current-price"],
        "reference": [".sku", ".reference"],
        "overview": [".woocommerce-product-details__short-description", "#description", ".product-short-description"],
        "category": [".woocommerce-breadcrumb", "nav.woocommerce-breadcrumb"]
    }
}

def get_db():
    try:
        client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
        return client['express-demo']
    except Exception as e:
        print(f"Error connecting to MongoDB: {e}", file=sys.stderr)
        return None

def extract_specific_data(soup, domain):
    config = None
    for d, cfg in SITE_CONFIGS.items():
        if d in domain:
            config = cfg
            break
    
    if not config:
        return None
    
    data = {}
    
    # --- 1. PRICE (High Priority: Metadata) ---
    # Prices in e-commerce are best fetched from Meta tags or JSON-LD to avoid related products
    meta_price = soup.find("meta", attrs={"property": "product:price:amount"}) or \
                 soup.find("meta", attrs={"itemprop": "price"}) or \
                 soup.find("meta", attrs={"name": "twitter:data1"})
    
    if meta_price and meta_price.get("content"):
        val = meta_price.get("content").strip()
        if any(c.isdigit() for c in val):
            # Format price nicely if it's just a number
            if "," not in val and "." not in val and len(val) > 4:
                 data["price"] = f"{val[:-3]} {val[-3:]} DT" # 849000 -> 849 000 DT
            else:
                 data["price"] = f"{val} DT"

    # --- 2. REFERENCE / SKU (Anchor) ---
    ref_el = None
    for s in config.get("reference", []):
        ref_el = soup.select_one(s)
        if ref_el and ref_el.get_text().strip():
            data["reference"] = ref_el.get_text().strip()
            break
            
    # --- 3. NAME ---
    name_el = None
    for s in config.get("name", []):
        name_el = soup.select_one(s)
        if name_el and name_el.get_text().strip():
            data["name"] = name_el.get_text().strip()
            break

    # Anchor area for remaining fields
    anchor = ref_el or name_el
    
    # --- 4. OTHER FIELDS ---
    for key in ["price", "overview", "category"]:
        if key in data and data[key] != "Not found": continue # Already found via metadata
        
        # Try local search around anchor
        if anchor:
            curr = anchor
            for _ in range(6): # Bubble up 6 levels
                for selector in config.get(key, []):
                    found = curr.select_one(selector)
                    if found and found.get_text().strip():
                        val = found.get_text().strip()
                        if key == "price" and (len(val) > 25 or not any(c.isdigit() for c in val)):
                            continue
                        data[key] = val
                        break
                if key in data: break
                curr = curr.parent
                if not curr: break
        
        # Global fallback
        if key not in data or data[key] == "Not found":
            for selector in config.get(key, []):
                found = soup.select_one(selector)
                if found and found.get_text().strip():
                    data[key] = found.get_text().strip()
                    break

    # Fill defaults
    for key in ["name", "price", "reference", "overview", "category"]:
        if key not in data:
            data[key] = "Not found"
            
    return data

def scrape_static(url):
    print(f"Using Static Scraper for: {url}", file=sys.stderr)
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,fr;q=0.8',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
    }
    
    domain = urllib.parse.urlparse(url).netloc
    
    response = requests.get(url, headers=headers, timeout=15)
    response.raise_for_status()
    
    soup = BeautifulSoup(response.text, 'html.parser')
    
    specific_data = extract_specific_data(soup, domain)
    
    data = {
        "title": soup.title.string.strip() if soup.title else "",
        "metaDescription": "",
        "h1": [h1.get_text().strip() for h1 in soup.find_all('h1')],
        "method": "static",
        "timestamp": datetime.datetime.now().isoformat(),
        "domain": domain
    }
    
    if specific_data:
        data.update(specific_data)
    
    desc = soup.find('meta', attrs={'name': 'description'})
    if desc:
        data["metaDescription"] = desc.get('content', '')
        
    return data

def scrape_selenium(url):
    print(f"Using Selenium Scraper for: {url}", file=sys.stderr)
    chrome_options = Options()
    chrome_options.add_argument("--headless")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--disable-blink-features=AutomationControlled")
    chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
    chrome_options.add_experimental_option('useAutomationExtension', False)
    chrome_options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
    
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=chrome_options)
    
    try:
        driver.get(url)
        time.sleep(5)
        
        soup = BeautifulSoup(driver.page_source, 'html.parser')
        domain = urllib.parse.urlparse(url).netloc
        specific_data = extract_specific_data(soup, domain)
        
        data = {
            "title": driver.title,
            "metaDescription": "",
            "method": "selenium",
            "timestamp": datetime.datetime.now().isoformat(),
            "domain": domain
        }
        
        if specific_data:
            data.update(specific_data)
            
        try:
            desc = driver.find_element("xpath", "//meta[@name='description']")
            data["metaDescription"] = desc.get_attribute("content")
        except:
            pass
            
        return data
    finally:
        driver.quit()

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No website ID or URL provided"}))
        return

    website_id_or_url = sys.argv[1]
    mode = sys.argv[2] if len(sys.argv) > 2 else "auto" 
    target_url = sys.argv[3] if len(sys.argv) > 3 else None

    db = get_db()
    
    url = target_url or website_id_or_url
    website_id = None
    
    if db is not None:
        websites_col = db['websites']
        if len(website_id_or_url) == 24: # Hex OID length
            try:
                website = websites_col.find_one({"_id": ObjectId(website_id_or_url)})
                if website:
                    if not target_url:
                        url = website['url']
                    website_id = website_id_or_url
            except:
                pass

    try:
        scraped_data = None
        
        # Determine mode if 'auto'
        if mode == "auto":
            if "wiki.tn" in url or "mytek.tn" in url:
                try:
                    scraped_data = scrape_static(url)
                except:
                    scraped_data = scrape_selenium(url)
            else:
                scraped_data = scrape_static(url)
        elif mode == "selenium":
            scraped_data = scrape_selenium(url)
        else:
            scraped_data = scrape_static(url)

        # 1. Update the 'websites' collection with the latest scrape summary
        if db is not None and website_id:
            websites_col = db['websites']
            websites_col.update_one(
                {"_id": ObjectId(website_id)},
                {
                    "$set": {
                        "scrapedData": scraped_data,
                        "lastScraped": datetime.datetime.now(),
                        "updatedAt": datetime.datetime.now()
                    }
                }
            )
            
            # 2. Save/Update the detailed product in the 'products' collection
            # We use 'products' collection in the same database (express-demo)
            # as per standard Express/Mongoose patterns, but identifying it as 'products'
            products_col = db['products']
            product_doc = {
                "name": scraped_data.get("name", "Unknown"),
                "price": scraped_data.get("price", "Not found"),
                "reference": scraped_data.get("reference", "Not found"),
                "overview": scraped_data.get("overview", "Not found"),
                "category": scraped_data.get("category", "Not found"),
                "url": url,
                "domain": scraped_data.get("domain", ""),
                "websiteId": ObjectId(website_id),
                "scrapedAt": datetime.datetime.now()
            }
            
            # Update if exists (by URL), otherwise insert
            products_col.update_one(
                {"url": url},
                {"$set": product_doc},
                upsert=True
            )
        
        print(json.dumps({"success": True, "data": scraped_data}))

    except Exception as e:
        print(json.dumps({"error": str(e)}))

if __name__ == "__main__":
    main()
