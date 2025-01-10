import Job, { JobDetails, ScrapedJobDetails } from "@/models/Job";
import chalk from "chalk";
import { inject, injectable } from "inversify";
import ora, { Ora } from "ora";
import puppeteer, { Browser, Page, Puppeteer } from "puppeteer";
import AiService from "./ai.service";
import LeverService from "../boards/lever.service";

@injectable()
export default class ScraperService {
    private browser: Browser | null = null;
    private board: LeverService;

    constructor(
        @inject(AiService) private aiService: AiService,
        @inject(LeverService) private leverService: LeverService
    ) {
        this.board = this.leverService;
    }

    public async initBrowser(): Promise<void> {
        this.browser = await puppeteer.launch({ headless: true });
    }

    public async closeBrowser(): Promise<void> {
        if (this.browser) {
            await this.browser.close();
            console.log('Browser closed');
        }
    }

    async batchScrape(jobs: Job[]) {
        const data: ScrapedJobDetails[] = [];
        try {
            await this.initBrowser();

            if (!this.browser) {
                throw new Error('Browser not initialized');
            }

            for (const job of jobs) {
                console.log('-------------------------');
                console.log(chalk.blue('Scraping', job.title));

                const spinner = ora('Starting...').start();

                const page = await this.browser.newPage();

                const scrapedData = await this.board.scrape(job.link, spinner, page);

                spinner.text = 'Extracting job details...';
                const jobDetails = await this.aiService.getJobDetails(scrapedData.description);

                spinner.succeed('Job details extracted');
                spinner.stop();

                data.push({ job_id: job.id, details: jobDetails, ...scrapedData });

                // // Sleep randomly between 1-5 seconds
                // const sleepDuration = Math.floor(Math.random() * 5) + 1;
                // console.log(chalk.yellow(`Sleeping for ${sleepDuration} seconds...`));
                // await new Promise((resolve) => setTimeout(resolve, sleepDuration * 1000));
            }
        } catch (error) {
            console.error('An error occurred during scraping:', error);
        } finally {
            await this.closeBrowser();

            return data;
        }
    }
}