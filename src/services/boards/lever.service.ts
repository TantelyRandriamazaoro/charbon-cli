import { ScrapedJobDetails } from "@/models/Job";
import { injectable } from "inversify";
import { Ora } from "ora";
import puppeteer, { Browser, Page } from "puppeteer";

interface Selectors {
    description: string;
}

@injectable()
export default class LeverService {
    private data: ScrapedJobDetails;
    private selectors: Selectors;

    
    constructor() {
        this.data = {
            description: '',
            custom_fields: [],
        };
        this.selectors = {
            description: '.posting-page',
        };
    }

    private async scrapeJobDescription(page: Page): Promise<void> {
        await page.waitForSelector(this.selectors.description);
        this.data.description = await page.evaluate((selectors: Selectors) => {
            const descriptionElement = document.querySelector(selectors.description);
            return descriptionElement ? descriptionElement.textContent || '' : '';
        }, this.selectors);
    }

    private async scrapeCustomFields(page: Page): Promise<void> {
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
    }

    public async scrape(url: string, spinner: Ora, page: Page): Promise<ScrapedJobDetails> {
        try {

            // Navigate to the job URL
            spinner.text = 'Navigating to job URL...';
            await page.goto(url, { waitUntil: 'networkidle2' });

            // Scrape the job description
            spinner.text = 'Scraping job description...';
            await this.scrapeJobDescription(page);

            // Scrape custom fields
            spinner.text = 'Scraping custom fields...';
            await this.scrapeCustomFields(page);
        } catch (error) {
            console.error('An error occurred during scraping:', error);
        }

        return this.data;
    }
}