import IDatabaseService from "@/models/IDatabaseService";
import Job from "@/models/Job";
import BrowserService from "@/services/core/browser.service";
import FileSystemService from "@/services/core/filesystem.service";
import InquirerService, { Actions } from "@/services/core/inquirer.service";
import LogService from "@/services/core/log.service";
import buildMultilineOutput from "@/utils/buildMultilineOutput";
import boxen from "boxen";
import chalk from "chalk";
import { inject, injectable } from "inversify";
import ora, { Ora } from "ora";
import { Page } from "puppeteer";

@injectable()
export default class ReviewController {
    private page: Page | null = null;
    private spinner: Ora | null = null;

    constructor(
        @inject('DatabaseService') private databaseService: IDatabaseService,
        @inject(InquirerService) private inquirerService: InquirerService,
        @inject(LogService) private logService: LogService,
        @inject(BrowserService) private browserService: BrowserService,
        @inject(FileSystemService) private fileSystemService: FileSystemService
    ) { }

    async init() {
        this.spinner = ora("Initializing services...").start();
        try {
            await this.databaseService.init();
            this.spinner?.succeed(chalk.green("Services initialized successfully."));
            await this.browserService.init({ headless: false });
        } catch (error) {
            this.spinner?.fail(chalk.red("Failed to initialize services."));
            throw error;
        }
    }

    async handle(job?: Job, type?: 'bulk' | 'live') {
        try {
            if (!job && type !== 'bulk') {
                job = await this.databaseService.getJob({ status: 'Scraped' });

                if (!job) {
                    throw new Error("No job to scrape");
                }
            }

            if (!job) {
                return;
            }

            const page = await this.browserService.newPage();
            await page.setViewport({ width: 1280, height: 1024, deviceScaleFactor: 1 });

            console.clear();
            this.spinner?.start(chalk.green("Opening job link..."));
            await page.goto(job.link, { waitUntil: 'domcontentloaded' });
            this.spinner?.succeed(chalk.green("Job link opened."));

            this.logService.logJobDetails(job);

            const action = await this.inquirerService.askForReview();

            if (action === Actions.PROCEED) {
                job.status = 'Reviewed';
            } else if (action === Actions.SKIP) {
                job.status = 'Not Interested';
            } else if (action === Actions.DUPLICATE) {
                job.status = 'Applied';
            }

            if (action === Actions.SWAP) {
                const resumes = await this.fileSystemService.listResume();
                if (!resumes) {
                    throw new Error("No resumes found");
                }

                const selectedResume = await this.inquirerService.askForResume(resumes);
                job.resume = selectedResume;
                job.status = 'Reviewed';
            }

            await this.databaseService.updateJob(job);
            await page.close();
        } catch (err) {
            console.error(err);
        }

        return;
    }

    async handleBulk(options?: { limit?: number }) {
        try {
            const jobs = await this.databaseService.getJobs({ status: 'Scraped', limit: options?.limit || 10 });

            if (!jobs || jobs.length === 0) {
                throw new Error("No jobs to scrape");
            }

            console.log(chalk.green(`Found ${jobs.length} jobs to review`));

            for (const job of jobs) {
                await this.handle(job, 'bulk');
            }

            console.log(chalk.green("All jobs reviewed successfully"));

            await this.browserService.closeBrowser();
        } catch (err) {
            console.error(err);
        }

        return;
    }
}