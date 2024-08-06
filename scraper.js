const axios = require("axios");
const cheerio = require("cheerio");

// Define a common User-Agent header to mimic a real browser
const userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36";

const scrapeChannelNewsAsia = async (page = 0) => {
    try {
      // URL with page number as a query parameter
      const url = `https://www.channelnewsasia.com/topic/mental-health?sort_by=field_release_date_value&sort_order=DESC&page=${page}`;
      const { data } = await axios.get(url);
      const $ = cheerio.load(data);
  
      const articles = [];

      $('h6.h6.list-object__heading').each((index, element) => {
        const titleElement = $(element).find('a.h6__link.list-object__heading-link');
        const title = titleElement.text().trim();
        const link = 'https://www.channelnewsasia.com' + titleElement.attr('href');
        const categoryElement = $(element).closest('div').find('p.list-object__category a.link');
        const category = categoryElement.text().trim();
  
        if (title && link && category) {
          articles.push({ title, link, category });
        }
      });
  
      const nextPageLink = $('a.pager__link[title="Go to next page"]').attr('href');
      if (nextPageLink) {
        const nextPageNumber = new URLSearchParams(nextPageLink).get('page');
        if (nextPageNumber) {
          articles.push(...await scrapeChannelNewsAsia(nextPageNumber));
        }
      }
  
      return articles;
    } catch (error) {
      console.error(`Error scraping Channel News Asia - Page ${page}:`, error);
      return [];
    }
  };

  const scrapeMentalHealthFoundation = async () => {
    try {
        const url = 'https://www.mentalhealth.org.uk/explore-mental-health/articles';
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);

        const articles = [];

        $('.mhf-tile').each((index, element) => {
            const titleElement = $(element).find('.mhf-button--secondary');
            const title = titleElement.text().trim();
            const link = $(element).find('.mhf-button--secondary').attr('href');
            const category = $(element).find('h3.h4.m-b-6 div').text().trim();
            const description = $(element).find('p').text().trim();

            // Adjust link if it's relative
            const fullLink = link.startsWith('http') ? link : `https://www.mentalhealth.org.uk${link}`;

            if (title && link && description) {
                articles.push({
                    title: 'Read more',
                    link: fullLink,
                    category,
                    description
                });
            }
        });

        return articles;
    } catch (error) {
        console.error('Error scraping Mental Health Foundation:', error);
        return [];
    }
};

module.exports = { scrapeChannelNewsAsia, scrapeMentalHealthFoundation };
