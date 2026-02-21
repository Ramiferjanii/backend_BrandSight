
const axios = require('axios');
const cheerio = require('cheerio');

async function check() {
    try {
        const response = await axios.get('https://www.tunisianet.com.tn/301-pc-portable-tunisie', {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const $ = cheerio.load(response.data);


        console.log('Next Button (a.next):', $('a.next').attr('href'));

        const all_as = $('a');
        console.log('Total links:', all_as.length);

        const next_links = $('a:contains("")').length;
        console.log('Links with :', next_links);

        const possible_products = $('[class*="product"]');
        console.log('Elements with class containing "product":', possible_products.length);

        if (possible_products.length > 0) {
            console.log('First 5 classes with "product":');
            possible_products.slice(0, 5).each((i, el) => {
                console.log($(el).attr('class'));
            });
        }

    } catch (e) {
        console.error(e.message);
    }
}

check();
