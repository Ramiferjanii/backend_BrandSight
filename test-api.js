const axios = require('axios');

const baseUrl = 'http://localhost:5000/api/auth';
const websiteUrl = 'http://localhost:5000/api/websites';

async function testRegister(description, name, email, password, shouldSucceed) {
    console.log(`Test: ${description}`);
    try {
        const response = await axios.post(`${baseUrl}/register`, { name, email, password });
        if (shouldSucceed) {
            console.log(`✓ Success: ${response.data.message}`);
        } else {
            console.log(`✗ Error: Should have failed`);
        }
    } catch (error) {
        if (!shouldSucceed) {
            const errorMsg = error.response ? JSON.stringify(error.response.data) : error.message;
            console.log(`✓ Correctly rejected: ${errorMsg}`);
        } else {
            const errorMsg = error.response ? JSON.stringify(error.response.data) : error.message;
            console.log(`✗ Error: Should have succeeded. ${errorMsg}`);
        }
    }
    console.log('---');
}

async function runScrapeTest(siteName, url, mode) {
    console.log(`\n--- Testing ${siteName} (${mode} mode) ---`);
    try {
        console.log(`Creating ${siteName} entry...`);
        const createRes = await axios.post(websiteUrl, {
            name: siteName,
            url: url,
            category: "test"
        }).catch(err => {
            if (err.response && err.response.status === 409) {
                return axios.get(websiteUrl).then(res => {
                    const existing = res.data.websites.find(w => w.url === url);
                    return { data: { website: existing } };
                });
            }
            throw err;
        });

        const siteId = createRes.data.website._id;
        console.log(`✓ Website ready with ID: ${siteId}`);

        console.log(`Triggering ${mode} scrape...`);
        const scrapeRes = await axios.post(`${websiteUrl}/${siteId}/scrape-trigger`, { mode: mode });
        console.log(`✓ Scrape success: ${scrapeRes.data.message}`);
        console.log('Scraped Data Results:');
        console.log(JSON.stringify(scrapeRes.data.website.scrapedData, null, 2));
    } catch (error) {
        const errorMsg = error.response ? JSON.stringify(error.response.data) : error.message;
        console.log(`✗ Test failed: ${errorMsg}`);
    }
}

async function runTests() {
    console.log('=== Testing Auth API and Password Validation ===\n');
    await testRegister('Password too short', 'John', 'john1@example.com', 'Ab1!', false);

    const uniqueEmail = `test_${Math.floor(Math.random() * 100000)}@example.com`;
    await testRegister('Valid password', 'Valid User', uniqueEmail, 'SecureP@ss124', true);

    console.log('\n=== Testing Website & Scraper API ===\n');

    // 1. Wikipedia (Static) - Fast and reliable
    await runScrapeTest("Wikipedia", "https://en.wikipedia.org/wiki/Main_Page", "static");

    // 2. Wikipedia (Selenium) - Verifies Selenium works on a friendly site
    await runScrapeTest("Wikipedia", "https://en.wikipedia.org/wiki/Main_Page", "selenium");

    // 3. Instagram (Selenium) - User specifically asked for it
    // Note: This might hit a login wall, but will show if selenium can access it
    await runScrapeTest("Instagram", "https://www.instagram.com/p/Cz9j_P0M_vG/", "selenium");

    console.log('\n=== All Tests Completed ===');
}

runTests();
