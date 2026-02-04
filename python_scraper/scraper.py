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

# Configuration
MONGO_URI = "mongodb://127.0.0.1:27017/express-demo"

def get_db():
    client = MongoClient(MONGO_URI)
    return client['express-demo']

def scrape_static(url):
    print(f"Using Static Scraper for: {url}")
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    response = requests.get(url, headers=headers, timeout=15)
    response.raise_for_status()
    
    soup = BeautifulSoup(response.text, 'html.parser')
    
    data = {
        "title": soup.title.string.strip() if soup.title else "",
        "metaDescription": "",
        "h1": [h1.get_text().strip() for h1 in soup.find_all('h1')],
        "linksCount": len(soup.find_all('a')),
        "imagesCount": len(soup.find_all('img')),
        "method": "static/automation",
        "timestamp": datetime.datetime.now().isoformat()
    }
    
    desc = soup.find('meta', attrs={'name': 'description'})
    if desc:
        data["metaDescription"] = desc.get('content', '')
        
    return data

def scrape_selenium(url):
    print(f"Using Selenium Scraper for: {url}")
    chrome_options = Options()
    chrome_options.add_argument("--headless")  # Run in headless mode
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--disable-blink-features=AutomationControlled")
    chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
    chrome_options.add_experimental_option('useAutomationExtension', False)
    chrome_options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36")
    
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=chrome_options)
    
    try:
        driver.get(url)
        time.sleep(5)  # Wait for JavaScript to load
        
        data = {
            "title": driver.title,
            "metaDescription": "",
            "h1": [h1.text.strip() for h1 in driver.find_elements("tag name", "h1")],
            "linksCount": len(driver.find_elements("tag name", "a")),
            "imagesCount": len(driver.find_elements("tag name", "img")),
            "method": "selenium",
            "timestamp": datetime.datetime.now().isoformat(),
            "pageSourceLength": len(driver.page_source)
        }
        
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
        print(json.dumps({"error": "No website ID provided"}))
        return

    website_id = sys.argv[1]
    # Default to static, but could be passed as arg
    mode = sys.argv[2] if len(sys.argv) > 2 else "static" 

    db = get_db()
    websites_col = db['websites']
    
    try:
        website = websites_col.find_one({"_id": ObjectId(website_id)})
        if not website:
            print(json.dumps({"error": "Website not found in database"}))
            return

        url = website['url']
        
        if mode == "selenium":
            scraped_data = scrape_selenium(url)
        else:
            scraped_data = scrape_static(url)

        # Update DB
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
        
        print(json.dumps({"success": True, "data": scraped_data}))

    except Exception as e:
        print(json.dumps({"error": str(e)}))

if __name__ == "__main__":
    main()
