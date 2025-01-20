import IDatabaseService from "@/models/IDatabaseService";
import Job from "@/models/Job";
import LeverService from "@/services/boards/lever.service";
import AiService from "@/services/core/ai.service";
import BrowserService from "@/services/core/browser.service";
import FeedbackService from "@/services/core/feedback.service";
import FileSystemService from "@/services/core/filesystem.service";
import InquirerService, { Actions } from "@/services/core/inquirer.service";
import LogService from "@/services/core/log.service";
import chalk from "chalk";
import inquirer from "inquirer";
import { inject, injectable } from "inversify";
import ora, { Ora } from "ora";

@injectable()
export default class ApplyController {
    private boardService: LeverService | null = null;
    private knowledgeBase: string | null = null;

    constructor(
        @inject('DatabaseService') private databaseService: IDatabaseService,
        @inject(BrowserService) private browserService: BrowserService,
        @inject(LeverService) private leverService: LeverService,
        @inject(InquirerService) private inquirerService: InquirerService,
        @inject(LogService) private logService: LogService,
        @inject(AiService) private aiService: AiService,
        @inject(FileSystemService) private fileSystemService: FileSystemService,
        @inject(FeedbackService) private feedbackService: FeedbackService
    ) { }

    async init() {
        this.feedbackService.start("Initializing services...");
        try {
            await this.databaseService.init();
            await this.browserService.init({ headless: false });
            await this.browserService.newPage();

            this.knowledgeBase = await this.fileSystemService.getKnowledgeBase() || null;

            this.feedbackService.succeed(chalk.green("Services initialized successfully."));
        } catch (error) {
            this.feedbackService.fail(chalk.red("Failed to initialize services."));
            throw error;
        }
    }

    async handle(job: Job, type: 'bulk' | 'live') {
        switch (job.board) {
            case "lever":
                this.boardService = this.leverService;
                break;
            default:
                throw new Error("Unsupported board");
        }

        const page = this.browserService.getPage();
        await page.setViewport({ width: 1280, height: 1024, deviceScaleFactor: 1 });
        await this.boardService.setPage(page);

        console.clear();

        console.log(chalk.blue('Applying to', job.title));
        console.log(chalk.green(job.link));

        if (type === 'bulk') {
            this.feedbackService.start("Navigating to application page...");
            await this.boardService?.navigateToApplicationPage(job, 'networkidle2');
            this.feedbackService.succeed(chalk.green("Application page loaded."));
        }

        this.feedbackService.start("Uploading resume...");
        await this.boardService?.uploadResume(job)
        this.feedbackService.succeed(chalk.green("Resume uploaded."));

        this.feedbackService.start("Filling out personal information...");
        await this.boardService?.fillPersonalInfo();
        this.feedbackService.succeed(chalk.green("Personal information filled."));

        if (job.custom_fields && job.custom_fields.length > 0) {
            this.feedbackService.start("Filling out custom fields...");
            await this.boardService?.fillCustomFields(job);
            this.feedbackService.succeed(chalk.green("Custom fields filled."));
        }

        this.feedbackService.start("Filling out cover letter...");
        await this.boardService?.fillCover();
        this.feedbackService.succeed(chalk.green("Cover letter filled."));

        if (job.custom_fields && job.custom_fields.length > 0) {

            while (true) {
                console.clear();
                this.logService.logAnsweredQuestions(job);

                const action = await this.inquirerService.askForFinalReview();

                if (action === Actions.PROCEED) {
                    break;
                } else if (action === Actions.SKIP) {
                    job.status = 'Not Interested';
                    await this.databaseService.updateJob(job);
                    return job;
                } else if (action === Actions.UPDATE) {
                    const { modify, instructions } = await this.inquirerService.askForModification(job);

                    const question = job.custom_fields.find(
                        (field) => field.label === modify
                    );

                    const knowledgeBase = await this.fileSystemService.getKnowledgeBase();

                    const { answers } = (await this.aiService.getCustomAnswers([question!], knowledgeBase, job.details, instructions)) || {};

                    await this.boardService?.fillCustomField(question!, answers![0].answer);

                    job.custom_fields_answers = job.custom_fields_answers?.map((answer) => {
                        if (answer.key === question!.name) {
                            answer.answer = answers![0].answer;
                        }
                        return answer;
                    });

                    console.log(chalk.cyan("Custom field updated."));
                }
            }
        } else {
            console.log(chalk.yellow("No custom fields found."));

            const { proceed } = await inquirer.prompt([
                {
                    type: "confirm",
                    name: "proceed",
                    message: "Do you want to submit the application?",
                    default: true,
                },
            ]);

            if (!proceed) {
                job.status = 'Not Interested';
                await this.databaseService.updateJob(job);

                await page.close();
                return job;
            }
        }

        this.feedbackService.start("Submitting application...");

        try {
            await this.boardService?.submitApplication();
            this.feedbackService.succeed(chalk.green("Application submitted."));
        } catch (error) {
            this.feedbackService.warn(chalk.yellow("Timeout occurred. Please check the application status."));
            const { submitted } = await inquirer.prompt({
                type: 'confirm',
                name: 'submitted',
                message: 'It sure went silent after you clicked the submit button. Did the application go through?',
                default: true
            });

            if (!submitted) {
                throw new Error('Application not submitted');
            }
        }

        job.status = "Applied";
        await this.databaseService.updateJob(job);

        if (type === 'bulk') {
            await page.close();
        }

        return job;
    }

    async handleBulk(options?: { limit?: number }) {
        const jobs = await this.databaseService.getJobs({ status: 'Prepared', limit: options?.limit || 10 });

        if (!jobs || jobs.length === 0) {
            console.log('No jobs to apply');
            return;
        }

        for (const job of jobs) {
            await this.handle(job, 'bulk');
        }

        console.log('All jobs applied');

        return;
    }
}