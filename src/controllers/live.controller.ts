import IDatabaseService from "@/models/IDatabaseService";
import Job from "@/models/Job";
import Status from "@/models/Status";
import LeverService from "@/services/boards/lever.service";
import AiService from "@/services/core/ai.service";
import BrowserService from "@/services/core/browser.service";
import FileSystemService from "@/services/core/filesystem.service";
import InquirerService, { Actions } from "@/services/core/inquirer.service";
import TransformationService from "@/services/core/transformation.service";
import buildMultilineOutput from "@/utils/buildMultilineOutput";
import boxen from "boxen";
import chalk from "chalk";
import ora, { Ora } from "ora";
import { inject, injectable } from "inversify";
import inquirer from "inquirer";
import { CookieSameSite, Page } from "puppeteer";
import LogService from "@/services/core/log.service";
import ScrapeController from "./scrape.controller";
import ReviewController from "./review.controller";
import PrepareController from "./prepare.controller";
import ApplyController from "./apply.controller";

@injectable()
export default class LiveController {
    private boardService: LeverService | null = null;
    private job: Job | undefined;
    private page: Page | undefined;
    private spinner: Ora | null = null;

    constructor(
        @inject("DatabaseService") private databaseService: IDatabaseService,
        @inject(BrowserService) private browserService: BrowserService,
        @inject(ScrapeController) private scrapeController: ScrapeController,
        @inject(ReviewController) private reviewController: ReviewController,
        @inject(PrepareController) private prepareController: PrepareController,
        @inject(ApplyController) private applyController: ApplyController
    ) { }

    async init() {
        this.spinner = ora("Initializing services...").start();
        try {
            await this.databaseService.init();
            this.spinner?.succeed(chalk.green("Services initialized successfully."));
            await this.browserService.init({ headless: false });
            await this.browserService.newPage();
        } catch (error) {
            this.spinner?.fail(chalk.red("Failed to initialize services."));
            throw error;
        }
    }

    async handle() {
        let job = await this.databaseService.getJob({ status: 'Discovered' });

        if (!job) {
            throw new Error("No job found");
        }

        const setJob = (data: Job) => {
            job = data;

            if (job.status === 'Not Found' || job.status === 'Not Interested') {
                throw new Error("Aborting job");
            }
        }

        try {
            setJob(await this.scrapeController.handle(job, 'live'))
            setJob(await this.reviewController.handle(job, 'live'))
            setJob(await this.prepareController.handle(job, 'live'))
            setJob(await this.applyController.handle(job, 'live'))
        } catch (error: any) {
            if (error?.message === "Aborting job") {
                console.log(chalk.red("Aborting job"));
            }
        } finally {
            console.log('Loading next job...');
            await this.handle();
        }
    }
}