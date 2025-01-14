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
            additionalInfo: 'textarea[name="comments"]',
            resumeUpload: '#resume-upload-input',
            resumeUploadSuccess: '.resume-upload-success',
            submitButton: '.btn-submit',
        };
    }

    async scrapeJobDescription(page: Page): Promise<string> {
        await page.waitForSelector(this.selectors.description);
        return await page.evaluate((selectors: typeof this.selectors) => {
            const descriptionElement = document.querySelector(selectors.description);
            return descriptionElement ? descriptionElement.textContent || '' : '';
        }, this.selectors);
    }

    async scrapeCustomFields(page: Page): Promise<LeverCustomFieldCard[]> {
        // Extract custom fields
        return await page.evaluate((selector) => {
            const customFields: Array<{ name: string; fields: any }> = [];
            const customFieldsElements = document.querySelectorAll(selector);
            customFieldsElements.forEach((customFieldElement) => {
                const name = customFieldElement.getAttribute('name') || '';
                const fields = JSON.parse(customFieldElement.getAttribute('value') || '{}').fields || [];
                customFields.push({ name, fields });
            });
            return customFields;
        }, this.selectors.fieldsData);
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
        if (!resumeInput) {
            throw new Error('Resume upload input not found');
        }

        await resumeInput.uploadFile(`./resumes/${job.resume}`);
        await page.waitForSelector(this.selectors.resumeUploadSuccess, { visible: true });

        // Fill in the resume
        if (job.custom_fields && job.custom_fields.length > 0) {
            // Fill in the custom fields
            for (const question of job.custom_fields) {
                const { answer } = job.custom_fields_answers?.find((a) => a.key === question.name) || {};

                if (!answer) {
                    throw new Error(`Answer not found for custom field: ${question.name}`);
                }

                await this.fillField(page, question, answer);
            }
        }

        const additionalInfo = await page.$(this.selectors.additionalInfo);
        await additionalInfo?.type(`As part of my application, I am attaching my resume for your review. I look forward to hearing from you soon.`);
    }

    async fillField(page: Page, question: NormalizedCustomField, answer: string) {
        if (question.type === 'checkbox' || question.type === 'radio') {
            const input = await page.$(`[name="${question.name}"][value="${answer}"]`);
            if (!input) {
                throw new Error(`Could not find input for custom field: ${question.name}`);
            }

            await input.click();

        } else if (question.type === 'select') {
            const select = await page.$(`[name="${question.name}"]`);
            if (!select) {
                throw new Error(`Could not find select for custom field: ${question.name}`);
            }

            await select.select(answer);
        } else {
            const input = await page.$(`[name="${question.name}"]`);
            if (!input) {
                throw new Error(`Could not find input for custom field: ${question.name}`);
            }

            // Clear the input field
            await input.focus();
            await input.click({ clickCount: 3 });
            await input.press('Backspace');

            // Type the answer
            await input.type(answer);
        }
    }
}