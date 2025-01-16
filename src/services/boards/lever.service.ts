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
            submitButton: '#btn-submit',
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

    async uploadResume(job: Job, page: Page) {
        const resumeInput = await page.$(this.selectors.resumeUpload) as ElementHandle<HTMLInputElement>;
        if (!resumeInput) {
            throw new Error('Resume upload input not found');
        }

        await resumeInput.uploadFile(`./resumes/${job.resume}`);
    }

    async isResumeUploaded(page: Page) {
        await page.waitForSelector(this.selectors.resumeUploadSuccess, { visible: true });
    }

    async apply(job: Job, page: Page) {
        // Fill in the resume
        if (job.custom_fields && job.custom_fields.length > 0) {
            // Fill in the custom fields
            for (const question of job.custom_fields) {
                const { answer } = job.custom_fields_answers?.find((a) => a.key === question.name) || {};

                if (!answer && question.required) {
                    throw new Error(`Answer not found for custom field: ${question.name}`);
                }

                await this.fillField(page, question, answer || 'N/A');
            }
        }

        const additionalInfo = await page.$(this.selectors.additionalInfo);
        await additionalInfo?.type(`This application was assisted and streamlined by "Charbon CLI", an AI-powered automation tool I built to showcase my technical and problem-solving skills in a real-world scenario while addressing the time-consuming nature of job applications. The tool leverages a knowledge base about my professional life, the Google Custom Search JSON API for global job searches, Puppeteer for scraping and automation, and OpenAI's GPT-4 API for large data transformations and crafting tailored responses. All applications were manually reviewed to ensure accuracy and relevance.\nShould the skills and technologies used in this project align with what your team is looking for in a candidate, I would be thrilled to discuss how I can contribute to your company. Regardless of your hiring decision, I would greatly appreciate any feedback on the project or its potential applications.\n\nShould you be interested in exploring the project, you can find it on my GitHub account: https://github.com/TantelyRandriamazaoro/charbon-cli. Currently at the MVP stage to allow me to apply to jobs more efficiently, I have a roadmap for expanding the tool further to have a GUI, CI/CD, Configuration Management, User Authentication and eventually monetization. That is until I can land my next job, which hopefully will be with your company. Thank you for your time and consideration.\n\nBest regards,\nTantely Randriamazaoro`);
    }

    async fillField(page: Page, question: NormalizedCustomField, answer: string | string[]) {
        if (question.type === 'checkbox') {
            const values = Array.isArray(answer) ? answer : [answer];

            for (const value of values) {
                const input = await page.$(`[name="${question.name}"][value="${value}"]`);
                if (!input) {
                    throw new Error(`Could not find input for custom field: ${question.name}`);
                }

                await input.click();
            }

        } else if (question.type === 'radio' && typeof answer === 'string') {
            const input = await page.$(`[name="${question.name}"][value="${answer}"]`);
            if (!input) {
                throw new Error(`Could not find input for custom field: ${question.name}`);
            }

            await input.click();
        } else if (question.type === 'select' && typeof answer === 'string') {
            const select = await page.$(`[name="${question.name}"]`);
            if (!select) {
                throw new Error(`Could not find select for custom field: ${question.name}`);
            }

            await select.select(answer);
        } else if ((question.type === 'text' || question.type === 'textarea') && typeof answer === 'string') {
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

    async submitApplication(page: Page) {
        const submitButton = await page.$(this.selectors.submitButton);
        if (!submitButton) {
            throw new Error('Submit button not found');
        }

        await submitButton.click();

        // Wait for the application to be submitted
        await page.waitForNavigation({ waitUntil: 'domcontentloaded' })

        // Check if url suffix is /thanks
        const url = page.url();

        if (!url.includes('/thanks')) {
            throw new Error('Application not submitted');
        }
    }
}