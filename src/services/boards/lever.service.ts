import Job, { LeverCustomFieldCard, NormalizedCustomField, ScrapedJobDetails } from "@/models/Job";
import { inject, injectable } from "inversify";
import { Ora } from "ora";
import { ElementHandle, Page } from "puppeteer";
import TransformationService from "../core/transformation.service";

@injectable()
export default class LeverService {
    private data: ScrapedJobDetails<LeverCustomFieldCard>;
    private selectors: { [key: string]: string };


    constructor() {
        this.data = {
            description: '',
            custom_fields: [],
            board: 'lever'
        };
        this.selectors = {
            description: '.posting-page',
            applyButton: '[data-qa="show-page-apply"]',
            applicationPage: '.application-page',
            fieldsData: '[data-qa="additional-cards"] input[type="hidden"]',
            name: 'input[name="name"]',
            email: 'input[name="email"]',
            phone: 'input[name="phone"]',
            location: 'input[name="location"]',
            currentCompany: 'input[name="org"]',
            linkedin: 'input[name="urls[LinkedIn]"]',
            github: 'input[name="urls[GitHub]"]',
            additionalInfo: 'textarea[name="content"]',
            resumeUpload: '#resume-upload-input',
            resumeUploadSuccess: '.resume-upload-success',
            submitButton: '.btn-submit',
        };
    }

    private async scrapeJobDescription(page: Page): Promise<void> {
        await page.waitForSelector(this.selectors.description);
        this.data.description = await page.evaluate((selectors: typeof this.selectors) => {
            const descriptionElement = document.querySelector(selectors.description);
            return descriptionElement ? descriptionElement.textContent || '' : '';
        }, this.selectors);
    }

    private async scrapeCustomFields(page: Page): Promise<void> {
        // Click the "Apply" button
        await page.click(this.selectors.applyButton);
        await page.waitForSelector(this.selectors.applicationPage);

        // Extract custom fields
        this.data.custom_fields = await page.evaluate((selector) => {
            return Array.from(document.querySelectorAll(selector)).map((element) => {
                const name = element.getAttribute('name') || '';
                const fields = JSON.parse(element.getAttribute('value') || '{}').fields || [];
                return { name, fields };
            });
        }, this.selectors.fieldsData);
        
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

    async apply(job: Job, page: Page) {
        await page.goto(job.link + '/apply', { waitUntil: 'networkidle2' });

        // Upload files
        const resumeInput = await page.$(this.selectors.resumeUpload) as ElementHandle<HTMLInputElement>;
        if (resumeInput) {
            await resumeInput.uploadFile(`./resumes/${job.resume}`);

            // Wait for the resume upload success message
            await page.waitForSelector(this.selectors.resumeUploadSuccess);
        }

        // Fill in the resume
        if (job.custom_fields && job.custom_fields.length > 0) {
            // Fill in the custom fields
            for (const customField of job.custom_fields) {
                const input = await page.$(`[name="${customField.name}"]`);
                if (!input) {
                    throw new Error(`Could not find input for custom field: ${customField.name}`);
                }

                if (!customField.value) {
                    throw new Error(`Custom field value is required: ${customField.name}`);
                }

                await input.type(customField.value);
            }
        }

        const additionalInfo = await page.$(this.selectors.additionalInfo);
        if (additionalInfo) {
            await additionalInfo.type(`As part of my application, I am attaching my resume for your review. I look forward to hearing from you soon.`);
        }
    }
}