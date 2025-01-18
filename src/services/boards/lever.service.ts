import Job, { LeverCustomFieldCard, NormalizedCustomField, ScrapedJobDetails } from "@/models/Job";
import { inject, injectable } from "inversify";
import { Ora } from "ora";
import { ElementHandle, Page } from "puppeteer";
import { cover, lever, personal_info } from "@config/input";

import TransformationService from "../core/transformation.service";
import inquirer from "inquirer";

@injectable()
export default class LeverService {
    private data: ScrapedJobDetails;
    private selectors: { [key: string]: string };


    constructor() {
        this.data = {
            description: '',
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
            location: '[data-qa="location-input"]',
            selectedLocation: '#selected-location',
            currentCompany: 'input[name="org"]',
            linkedin: 'input[name="urls[LinkedIn]"]',
            linkedinProfile: 'input[name="urls[LinkedIn Profile"]',
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
        // Enable request interception
        await page.setRequestInterception(true);

        page.on('request', (request) => {
            // Check if the request URL matches the API call you want to abort
            if (request.url() === 'https://jobs.lever.co/parseResume') {
                console.log(`Aborting request to: ${request.url()}`);
                request.abort(); // Abort the request
            } else {
                request.continue(); // Allow other requests to continue
            }
        });

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

    }

    async fillPersonalInfo(page: Page) {
        const fields = [
            { selector: this.selectors.name, value: `${personal_info.first_name} ${personal_info.last_name}` },
            { selector: this.selectors.email, value: personal_info.email },
            { selector: this.selectors.phone, value: personal_info.phone },
            { selector: this.selectors.location, value: personal_info.location },
            { selector: this.selectors.selectedLocation, value: lever.location },
            { selector: this.selectors.currentCompany, value: personal_info.current_company },
            { selector: this.selectors.linkedin, value: personal_info.linkedin },
            { selector: this.selectors.linkedinProfile, value: personal_info.linkedin },
            { selector: this.selectors.github, value: personal_info.github }
        ];

        // Wait for a moment to let Lever auto-fill the fields
        for (const field of fields) {
            if (field.selector && field.value) {
                await page.evaluate((selector, value) => {
                    const input = document.querySelector(selector) as HTMLInputElement;
                    if (input) {
                        input.value = value;
                    }
                }, field.selector, field.value);
            }
        }
    }

    async fillCover(page: Page) {
        const additionalInfo = await page.$(this.selectors.additionalInfo);
        await additionalInfo?.type(cover);
    }

    async fillCustomField(page: Page, question: NormalizedCustomField, answer: string | string[]) {
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

    async fillCustomFields(job: Job, page: Page) {
        // Fill in the resume
        if (job.custom_fields && job.custom_fields.length > 0) {
            // Fill in the custom fields
            for (const question of job.custom_fields) {
                const { answer } = job.custom_fields_answers?.find((a) => a.key === question.name) || {};

                if (answer) {
                    await this.fillCustomField(page, question, answer);
                }
            }
        }
    }

    async submitApplication(page: Page) {
        const submitButton = await page.$(this.selectors.submitButton);
        if (!submitButton) {
            throw new Error('Submit button not found');
        }

        await submitButton.click();

        await page.waitForNavigation({ waitUntil: 'domcontentloaded' });
        // Check if url suffix is /thanks
        const url = page.url();

        if (!url.includes('/thanks')) {
            throw new Error('Application not submitted');
        }
    }
}