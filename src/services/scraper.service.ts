import Boards from "@/models/boards";
import { injectable } from "inversify";
import puppeteer, { Browser, Page, Puppeteer } from "puppeteer";


export interface ScrapedData {
    description: string;
    custom_fields: Array<{
        name: string;
        fields: any;
    }>;
}

interface Selectors {
    description: string;
}

class LeverScraper {
    private data: ScrapedData;
    private selectors: Selectors;
    private browser: Browser | null;

    constructor() {
        this.data = {
            description: '',
            custom_fields: [],
        };
        this.selectors = {
            description: '.posting-page',
        };
        this.browser = null;
    }

    private async initBrowser(): Promise<void> {
        this.browser = await puppeteer.launch({ headless: true });
    }

    private async closeBrowser(): Promise<void> {
        if (this.browser) {
            await this.browser.close();
            console.log('Browser closed');
        }
    }

    private async scrapeJobDescription(page: Page): Promise<void> {
        console.log('Scraping job description...');
        await page.waitForSelector(this.selectors.description);
        this.data.description = await page.evaluate((selectors: Selectors) => {
            const descriptionElement = document.querySelector(selectors.description);
            return descriptionElement ? descriptionElement.textContent || '' : '';
        }, this.selectors);
        console.log('Job description scraped successfully');
    }

    private async scrapeCustomFields(page: Page): Promise<void> {
        console.log('Scraping custom fields...');
        // Click the "Apply" button
        await page.click('[data-qa="show-page-apply"]');
        await page.waitForSelector('.application-page');

        // Extract custom fields
        this.data.custom_fields = await page.evaluate(() => {
            const customFields: Array<{ name: string; fields: any }> = [];
            const customFieldsElements = document.querySelectorAll('[data-qa="additional-cards"] input[type="hidden"]');
            customFieldsElements.forEach((customFieldElement) => {
                const name = customFieldElement.getAttribute('name') || '';
                const fields = JSON.parse(customFieldElement.getAttribute('value') || '{}').fields || [];
                customFields.push({ name, fields });
            });
            return customFields;
        });
        console.log('Custom fields scraped successfully');
    }

    public async scrape(url: string): Promise<ScrapedData> {
        try {
            // Initialize Puppeteer
            await this.initBrowser();
            const page = await this.browser!.newPage();

            // Navigate to the job URL
            console.log(`Navigating to ${url}`);
            await page.goto(url, { waitUntil: 'networkidle2' });

            // Scrape the job description
            await this.scrapeJobDescription(page);

            // Scrape custom fields
            await this.scrapeCustomFields(page);

            console.log('Scraping completed successfully:', JSON.stringify(this.data));
        } catch (error) {
            console.error('An error occurred during scraping:', error);
        } finally {
            // Close the browser
            await this.closeBrowser();
        }

        return this.data;
    }
}

@injectable()
export default class ScraperService {
    private scraper: LeverScraper;

    constructor() {
        this.scraper = new LeverScraper();
    }

    async scrape(url: string) {
        return this.scraper.scrape(url);
    }
}