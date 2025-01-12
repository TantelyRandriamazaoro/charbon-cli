import { LeverCustomFieldCard, NormalizedCustomField, ScrapedJobDetails } from "@/models/Job";
import { inject, injectable } from "inversify";
import { Ora } from "ora";
import { Page } from "puppeteer";
import TransformationService from "../core/transformation.service";

interface Selectors {
    description: string;
}

@injectable()
export default class LeverService {
    private data: ScrapedJobDetails<LeverCustomFieldCard>;
    private selectors: Selectors;


    constructor() {
        this.data = {
            description: '',
            custom_fields: [],
            board: 'lever'
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

    public async scrape(url: string, spinner: Ora, page: Page): Promise<ScrapedJobDetails<LeverCustomFieldCard>> {
        // Navigate to the job URL
        spinner.text = 'Navigating to job URL...';
        await page.goto(url, { waitUntil: 'networkidle2' });

        // Scrape the job description
        spinner.text = 'Scraping job description...';
        await this.scrapeJobDescription(page);

        // Scrape custom fields
        spinner.text = 'Scraping custom fields...';
        await this.scrapeCustomFields(page);

        return this.data;
    }

    public isMatch(url: string): boolean {
        const [base] = url.split('?');

        const regex = /^https:\/\/jobs\.lever\.co\/[a-zA-Z0-9\-]+\/[a-f0-9\-]{36}(\/apply)?$/;
        return regex.test(base);
    }
}