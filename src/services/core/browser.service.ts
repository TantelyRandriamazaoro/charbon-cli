import Job, { JobDetails, LeverCustomFieldCard, ScrapedJobDetails } from "@/models/Job";
import chalk from "chalk";
import { inject, injectable } from "inversify";
import ora, { Ora } from "ora";
import puppeteer, { Browser, Page, Puppeteer } from "puppeteer";
import AiService from "./ai.service";
import LeverService from "../boards/lever.service";

@injectable()
export default class BrowserService {
    private browser: Browser | null = null;
    private boardService: LeverService | null = null;

    constructor(
        @inject(AiService) private aiService: AiService,
        @inject(LeverService) private leverService: LeverService
    ) { }

    public async initBrowser(): Promise<void> {
        this.browser = await puppeteer.launch({ headless: false });
    }

    public async closeBrowser(): Promise<void> {
        if (this.browser) {
            await this.browser.close();
            console.log('Browser closed');
        }
    }

    async batchScrape(jobs: Job[]): Promise<{ data: ScrapedJobDetails<LeverCustomFieldCard>[], failed: Job[] }> {
        const data: ScrapedJobDetails<LeverCustomFieldCard>[] = [];
        const failed: Job[] = [];
        const spinner = ora('Starting...');

        await this.initBrowser();

        if (!this.browser) {
            throw new Error('Browser not initialized');
        }

        for (const job of jobs) {
            try {
                console.log('-------------------------');
                console.log(chalk.blue('Scraping', job.title));
                console.log(chalk.green(job.link));

                switch (job.board) {
                    case 'lever':
                        this.boardService = this.leverService;
                        break;
                    default:
                        console.error('Unsupported board:', job.board);
                        continue;
                }

                spinner.start();

                const page = await this.browser.newPage();

                await page.setViewport({
                    width: 1280,  // Width of the viewport
                    height: 720,  // Height of the viewport
                    deviceScaleFactor: 1, // Device scale factor
                });

                const scrapedData = await this.boardService.scrape(job.link, spinner, page);

                spinner.text = 'Extracting job details...';
                const jobDetails = await this.aiService.getJobDetails(scrapedData.description);

                spinner.succeed('Job details extracted');
                spinner.stop();

                data.push({ job_id: job.id, details: jobDetails, ...scrapedData });
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
        await this.initBrowser();

        if (!this.browser) {
            throw new Error('Browser not initialized');
        }

        for (const job of jobs) {
            try {
                console.log('-------------------------');
                console.log(chalk.blue('Applying to', job.title));
                console.log(chalk.green(job.link));

                switch (job.board) {
                    case 'lever':
                        this.boardService = this.leverService;
                        break;
                    default:
                        console.error('Unsupported board:', job.board);
                        continue;
                }

                const page = await this.browser.newPage();

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