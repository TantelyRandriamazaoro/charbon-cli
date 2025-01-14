import Job, { JobDetails, LeverCustomFieldCard, NormalizedCustomField, RawCustomField, ScrapedJobDetails } from "@/models/Job";
import chalk from "chalk";
import { inject, injectable } from "inversify";
import ora, { Ora } from "ora";
import puppeteer, { Browser, Page, Puppeteer } from "puppeteer";
import AiService from "./ai.service";
import LeverService from "../boards/lever.service";
import Boards from "@/models/boards";
import { EventEmitter } from "events";

@injectable()
export default class BrowserService {
    private browser: Browser | null = null;
    private boardService: LeverService | null = null;

    constructor(
        @inject(AiService) private aiService: AiService,
        @inject(LeverService) private leverService: LeverService,
    ) { }

    public async init(options: { headless: boolean }): Promise<void> {
        this.browser = await puppeteer.launch({ headless: options.headless });
    }

    public async closeBrowser(): Promise<void> {
        if (this.browser) {
            await this.browser.close();
            console.log('Browser closed');
        }
    }

    newPage(): Promise<Page> {
        if (!this.browser) {
            throw new Error('Browser not initialized');
        }

        return this.browser.newPage();
    }

    setBoard(board: Boards | undefined) {
        switch (board) {
            case 'lever':
                this.boardService = this.leverService;
                break;
            default:
                console.error('Unsupported board:', board);
        }
    }

    async batchScrape(jobs: Job[]): Promise<{ data: ScrapedJobDetails<LeverCustomFieldCard>[], failed: Job[] }> {
        const data: ScrapedJobDetails<LeverCustomFieldCard>[] = [];
        const failed: Job[] = [];
        const spinner = ora('Starting...');

        await this.init({ headless: true });

        if (!this.browser) {
            throw new Error('Browser not initialized');
        }

        for (const job of jobs) {
            try {
                if (!job.board) {
                    throw new Error('Job board not set');
                }

                this.setBoard(job.board);

                if (!this.boardService) {
                    throw new Error('Board service not initialized');
                }

                console.log('-------------------------');
                console.log(chalk.blue('Scraping', job.title));
                console.log(chalk.green(job.link));

                spinner.start();

                const page = await this.newPage();

                await page.setViewport({
                    width: 1280,  // Width of the viewport
                    height: 720,  // Height of the viewport
                    deviceScaleFactor: 1, // Device scale factor
                });

                // Navigate to the job URL
                spinner.text = 'Navigating to job URL...';
                await page.goto(job.link, { waitUntil: 'networkidle2' });

                // Scrape the job description
                spinner.text = 'Scraping job description...';
                const description = await this.boardService.scrapeJobDescription(page);

                await page.goto(job.link + '/apply', { waitUntil: 'networkidle2' });
                // Scrape custom fields
                spinner.text = 'Scraping custom fields...';
                const fields = await this.boardService.scrapeCustomFields(page);

                spinner.text = 'Extracting job details...';
                const details = await this.aiService.getJobDetails(description);

                spinner.succeed('Job details extracted');
                spinner.stop();

                data.push({ job_id: job.id, details, custom_fields: fields, description, board: job.board });
            } catch (error) {
                spinner.fail('Failed to scrape job');
                console.error('An error occurred while scraping job:', error);
                failed.push(job);
            }
        }


        await this.closeBrowser();

        return { data, failed };
    }

    async batchApply(jobs: Job[]): Promise<void> {
        await this.init({ headless: true });

        if (!this.browser) {
            throw new Error('Browser not initialized');
        }

        for (const job of jobs) {
            try {
                this.setBoard(job.board);

                if (!this.boardService) {
                    throw new Error('Board service not initialized');
                }

                console.log('-------------------------');
                console.log(chalk.blue('Applying to', job.title));
                console.log(chalk.green(job.link));

                const page = await this.newPage();

                await page.setViewport({
                    width: 1280,  // Width of the viewport
                    height: 1024,  // Height of the viewport
                    deviceScaleFactor: 1, // Device scale factor
                });

                await this.boardService.apply(job, page);
            } catch (error) {
                console.error('An error occurred while applying to job:', error);
            }
        }

        // await this.closeBrowser();
    }


}