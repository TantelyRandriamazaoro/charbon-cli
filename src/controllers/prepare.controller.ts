import IDatabaseService from "@/models/IDatabaseService";
import Job from "@/models/Job";
import LeverService from "@/services/boards/lever.service";
import AiService from "@/services/core/ai.service";
import BrowserService from "@/services/core/browser.service";
import FeedbackService from "@/services/core/feedback.service";
import FileSystemService from "@/services/core/filesystem.service";
import TransformationService from "@/services/core/transformation.service";
import chalk from "chalk";
import { inject, injectable } from "inversify";
import ora, { Ora } from "ora";

@injectable()
export default class PrepareController {
    private boardService: LeverService | null = null;

    constructor(
        @inject(AiService) private aiService: AiService,
        @inject(FileSystemService) private fileSystemService: FileSystemService,
        @inject(TransformationService) private transformationService: TransformationService,
        @inject(BrowserService) private browserService: BrowserService,
        @inject(LeverService) private leverService: LeverService,
        @inject(FeedbackService) private feedbackService: FeedbackService,
        @inject('DatabaseService') private databaseService: IDatabaseService
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

            switch (job.board) {
                case "lever":
                    this.boardService = this.leverService;
                    break;
                default:
                    throw new Error("Unsupported board");
            }

            console.clear();

            console.log('-------------------------');
            console.log(chalk.blue('Preparing', job.title));
            console.log(chalk.green(job.link));

            const page = this.browserService.getPage();
            await page.setViewport({ width: 1280, height: 1024, deviceScaleFactor: 1 });
            await this.boardService.setPage(page);

            this.feedbackService.start("Navigating to application page...");
            await this.boardService.navigateToApplicationPage(job);
            this.feedbackService.succeed(chalk.green("Application page loaded."));

            const fields = await this.boardService.scrapeCustomFields();

            if (fields.length > 0) {
                this.feedbackService.start("Processing custom fields...");
                job.custom_fields = this.transformationService.normalizeCustomFields(fields, job.board);
                this.feedbackService.succeed(chalk.green("Custom fields processed."));


                const knowledgeBase = await this.fileSystemService.getKnowledgeBase();

                if (!knowledgeBase) {
                    throw new Error("Knowledge base not found");
                }

                this.feedbackService.start("Getting custom answers...");
                const { answers } = (await this.aiService.getCustomAnswers(job.custom_fields, knowledgeBase, job.details)) || {};
                job.custom_fields_answers = answers;
                this.feedbackService.succeed(chalk.green("Custom answers retrieved."));
            } else {
                chalk.yellow("No custom fields found.");
            }

            job.status = "Prepared";

            await this.databaseService.updateJob(job);

            if (type == 'bulk') {
                await page.close();
            }

        } catch (err) {
            console.error(err);
        }

        return job;
    }

    async handleBulk(options?: { limit?: number }) {
        try {
            const jobs = await this.databaseService.getJobs({ status: 'Reviewed', limit: options?.limit || 10 });

            if (!jobs || jobs.length === 0) {
                throw new Error("No jobs to prepare");
            }

            console.clear();

            console.log(chalk.green(`Found ${jobs.length} jobs to prepare`));

            for (const job of jobs) {
                await this.handle(job, 'bulk');
            }

            console.log(chalk.green("All jobs prepared successfully"));
        } catch (err) {
            console.error(err);
        }

        return;
    }
}