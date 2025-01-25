import IDatabaseService from "@/models/IDatabaseService";
import Job, { ScrapedJobDetails } from "@/models/Job";
import LeverService from "@/services/boards/lever.service";
import AiService from "@/services/core/ai.service";
import BrowserService from "@/services/core/browser.service";
import FeedbackService from "@/services/core/feedback.service";
import TransformationService from "@/services/core/transformation.service";
import chalk from "chalk";
import { inject, injectable } from "inversify";
import ora, { Ora } from "ora";
import { Page } from "puppeteer";

@injectable()
export default class ScrapeController {
    private boardService: LeverService | null = null;
    private page: Page | undefined;
    private total = 0;

    constructor(
        @inject('DatabaseService') private databaseService: IDatabaseService,
        @inject(BrowserService) private browserService: BrowserService,
        @inject(TransformationService) private transformationService: TransformationService,
        @inject(AiService) private aiService: AiService,
        @inject(LeverService) private leverService: LeverService,
        @inject(FeedbackService) private feedbackService: FeedbackService
    ) { }

    async init() {
        this.feedbackService.start("Initializing services...");
        try {
            await this.databaseService.init();
            this.feedbackService.succeed(chalk.green("Services initialized successfully."));
            await this.browserService.init({ headless: true });
            await this.browserService.newPage();
        } catch (error) {
            this.feedbackService.fail(chalk.red("Failed to initialize services."));
            throw error;
        }
    }

    async handle(job: Job, type: 'bulk' | 'live') {
        try {
            try {
                switch (job.board) {
                    case "lever":
                        this.boardService = this.leverService;
                        break;
                    default:
                        throw new Error("Unsupported board");
                }

                this.page = this.browserService.getPage();
                await this.page.setViewport({ width: 1280, height: 1024, deviceScaleFactor: 1 });
                await this.boardService.setPage(this.page);

                if (type === 'live') {
                    console.clear();
                } else {
                    console.log('-------------------------');
                }

                console.log(chalk.blue('Scraping', job.title));
                console.log(chalk.green(job.link));

                this.feedbackService.start("Navigating to job page...");
                await this.page!.goto(job.link, { waitUntil: "domcontentloaded" });
                this.feedbackService.succeed(chalk.green("Job page loaded."));


                const title = await this.page?.title();

                if (title.includes('404')) {
                    throw new Error("Not Found");
                }

                this.feedbackService.start("Scraping job details...");
                job.description = await this.boardService!.scrapeJobDescription();
                this.feedbackService.succeed(chalk.green("Job details scraped."));

                this.feedbackService.start("Extracting job details...");
                job.details = await this.aiService.getJobDetails(job.description);
                this.feedbackService.succeed(chalk.green("Job details extracted."));

                job.status = "Scraped";

            } catch (error: any) {
                if (error.message === "Not Found") {
                    console.error(chalk.red("Job not found."));
                    job.status = "Not Found";
                } else {
                    console.error(chalk.red("Failed to scrape job."));
                    console.error(error);
                }
            } finally {
                await this.databaseService.updateJob(job);
            }

            console.log('Job scraping completed successfully');
        } catch (error) {
            console.error('An error occurred during scraping:', error);
        }

        return job;
    }

    async handleBulk(options?: { limit?: number }) {
        try {
            const jobs = await this.databaseService.getJobs({ status: 'Discovered', limit: options?.limit || 10 });

            if (!jobs || jobs.length === 0) {
                console.log('No jobs to scrape');
                return;
            }

            this.total = jobs.length;

            console.clear();

            console.log(chalk.blue(`Bulk scraping ${this.total} jobs`));
            for (const job of jobs) {
                await this.handle(job, 'bulk');
            }

            console.log('Bulk scraping completed successfully');

            await this.browserService.closeBrowser();
        } catch (error) {
            console.error('An error occurred during bulk scraping:', error);
        }

        return;
    }
}