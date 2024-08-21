const axios = require("axios");
const cheerio = require("cheerio");

// Define a common User-Agent header to mimic a real browser
const userAgent =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36";

// Fetch HTML content from a URL with a custom User-Agent
const fetchHTML = async (url) => {
    try {
    const { data } = await axios.get(url, {
      headers: { "User-Agent": userAgent },
    });
    return data;
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    throw error;
  }
};

// Scrape articles from Channel News Asia
const scrapeChannelNewsAsia = async (page = 0, maxPages = 10) => {
    const url = `https://www.channelnewsasia.com/topic/mental-health?sort_by=field_release_date_value&sort_order=DESC&page=${page}`;
    try {
        const html = await fetchHTML(url);
        const $ = cheerio.load(html);
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

        // Check if there is a next page and if we haven't reached the max page limit
        const nextPageLink = $('a.pager__link[title="Go to next page"]').attr('href');
        if (nextPageLink && page < maxPages - 1) {
        const nextPageNumber = new URLSearchParams(nextPageLink).get('page');
        if (nextPageNumber) {
            const nextPageArticles = await scrapeChannelNewsAsia(Number(nextPageNumber), maxPages);
            articles.push(...nextPageArticles);
        }
        }

        return articles;
    } catch (error) {
        console.error(`Error scraping Channel News Asia - Page ${page}:`, error);
        return [];
    }
};

// Scrape articles from Mental Health Foundation
const scrapeMentalHealthFoundation = async () => {
    const url = 'https://www.mentalhealth.org.uk/explore-mental-health/articles';
    try {
        const html = await fetchHTML(url);
        const $ = cheerio.load(html);
        const articles = [];

        $('.mhf-tile').each((index, element) => {
        const titleElement = $(element).find('.mhf-button--secondary');
        const title = titleElement.text().trim();
        const link = $(element).find('.mhf-button--secondary').attr('href');
        const category = $(element).find('h3.h4.m-b-6 div').text().trim();
        const description = $(element).find('p').text().trim();

        const fullLink = link.startsWith('http') ? link : `https://www.mentalhealth.org.uk${link}`;

        if (title && fullLink && description) {
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
