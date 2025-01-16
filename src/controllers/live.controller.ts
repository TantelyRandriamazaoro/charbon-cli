import IDatabaseService from "@/models/IDatabaseService";
import Job from "@/models/Job";
import Status from "@/models/Status";
import LeverService from "@/services/boards/lever.service";
import AiService from "@/services/core/ai.service";
import BrowserService from "@/services/core/browser.service";
import FileSystemService from "@/services/core/filesystem.service";
import InquirerService from "@/services/core/inquirer.service";
import TransformationService from "@/services/core/transformation.service";
import buildMultilineOutput from "@/utils/buildMultilineOutput";
import boxen from "boxen";
import chalk from "chalk";
import ora, { Ora } from "ora";
import { inject, injectable } from "inversify";
import inquirer from "inquirer";
import { CookieSameSite, Page } from "puppeteer";

@injectable()
export default class LiveController {
    private boardService: LeverService | null = null;
    private job: Job | undefined;
    private page: Page | undefined;
    private spinner: Ora | null = null;

    constructor(
        @inject("DatabaseService") private databaseService: IDatabaseService,
        @inject(BrowserService) private browserService: BrowserService,
        @inject(AiService) private aiService: AiService,
        @inject(InquirerService) private inquirerService: InquirerService,
        @inject(TransformationService) private transformationService: TransformationService,
        @inject(FileSystemService) private fileSystemService: FileSystemService,
        @inject(LeverService) private leverService: LeverService
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

    async handle() {
        this.spinner = ora("Preparing to process job...").start();
        try {
            this.page = await this.browserService.newPage();
            await this.page.setViewport({ width: 1280, height: 1024, deviceScaleFactor: 1 });

            console.clear();
            await this.retrieveJob();

            if (this.job) {
                await this.processJob();
                await this.askForModifications();
                await this.submit();
            }
        } catch (error: any) {
            if (error.message === "Job skipped") {
                this.spinner?.warn(chalk.yellow("Job skipped."));
                this.job!.status = "Not Interested";
                return;
            }

            if (error.message === "Not Found") {
                this.spinner?.fail(chalk.yellow("Job not found."));
                this.job!.status = "Not Found";
                return;
            }

            this.spinner?.fail(chalk.red("Error encountered during job handling."));
            console.error(chalk.red(error));
        } finally {
            if (this.job) {
                console.log(chalk.blue("Job processing completed."));
                await this.databaseService.updateJob(this.job);


                this.spinner.start("Loading the next job...");
                setTimeout(async () => {
                    await this.page?.close();
                    this.job = undefined;

                    this.spinner?.succeed(chalk.green("Next job loaded."));
                    await this.handle();
                }, 2000);
            }
        }
    }

    private async retrieveJob() {
        this.job = await this.databaseService.getDiscoveredJob();

        if (!this.job) {
            this.spinner?.fail(chalk.yellow("No jobs to process."));
            return;
        }

        if (!this.job.board) {
            this.spinner?.fail(chalk.yellow("Job board not set."));
            return;
        }

        this.spinner?.succeed(chalk.green("Job retrieved successfully."));

        switch (this.job.board) {
            case "lever":
                this.boardService = this.leverService;
                break;
            default:
                throw new Error("Unsupported board");
        }
    }

    private async processJob() {
        await this.navigateToJobPage();

        const title = await this.page?.title();

        if (title!.includes('404')) {
            throw new Error("Not Found");
        }

        await this.extractJobDetails();
        this.logJobDetails();

        const { proceed } = await inquirer.prompt([
            {
                type: "confirm",
                name: "proceed",
                message: "Are you interested in this job?",
                default: true,
            },
        ]);

        if (!proceed) {
            throw new Error("Job skipped");
        }

        await this.navigateToApplicationPage();

        this.spinner?.start("Uploading resume...");
        await this.boardService?.uploadResume(this.job!, this.page!)
        this.spinner?.succeed(chalk.green("Resume uploaded."));


        await this.handleCustomFields();
        await this.boardService?.apply(this.job!, this.page!);

        this.spinner?.start("Checking if resume was uploaded...");
        await this.boardService?.isResumeUploaded(this.page!);
        this.spinner?.succeed(chalk.green("Resume uploaded successfully."));
    }

    private async navigateToJobPage() {
        this.spinner?.start("Navigating to job page...");
        await this.page!.goto(this.job!.link, { waitUntil: "domcontentloaded" });
        this.spinner?.succeed(chalk.green("Job page loaded."));
    }

    private async extractJobDetails() {
        this.spinner?.start("Scraping job description...");
        this.job!.description = await this.boardService!.scrapeJobDescription(this.page!);
        this.job!.details = await this.aiService.getJobDetails(this.job!.description);
        this.spinner?.succeed(chalk.green("Job details extracted."));
    }

    private logJobDetails() {
        const { getOutput, append } = buildMultilineOutput();
        const details = this.job?.details;

        append(`Reviewing job: ${this.job?.title}`, chalk.blue);
        append(this.job?.link, chalk.green);
        append(details?.summary);

        if (details?.location) append({ label: "Location", message: details.location }, chalk.cyan);

        if (details?.remote !== undefined)
            append({ label: "Remote", message: String(details.remote) }, chalk.cyan);

        if (details?.job_type)
            append({ label: "Job type", message: details.job_type }, chalk.cyan);

        if (details?.experience)
            append({ label: "Experience level", message: details.experience }, chalk.cyan);

        if (details?.salary)
            append({ label: "Salary", message: details.salary }, chalk.cyan);

        if (details?.isAiFriendly !== undefined)
            append({ label: "AI Friendly", message: String(details.isAiFriendly) }, chalk.cyan);

        if (details?.technical_skills)
            append(
                { label: "Technical Skills", message: details.technical_skills.join(" | ") },
                chalk.cyan
            );

        if (details?.catch) append({ label: "Catch", message: details.catch }, chalk.red);

        console.log(
            boxen(getOutput(), {
                padding: 1,
                margin: 1,
                borderStyle: "round",
                borderColor: "cyan",
            })
        );
    }

    private async navigateToApplicationPage() {
        this.spinner?.start("Navigating to application page...");
        await this.page!.goto(`${this.job!.link}/apply`, { waitUntil: "domcontentloaded" });
        this.spinner?.succeed(chalk.green("Application page loaded."));
    }

    private async handleCustomFields() {
        const fields = await this.boardService!.scrapeCustomFields(this.page!);

        this.spinner?.start("Processing custom fields...");
        if (fields.length > 0) {
            this.job!.custom_fields = this.transformationService.normalizeCustomFields(fields, this.job!.board);

            const knowledgeBase = await this.fileSystemService.getKnowledgeBase();

            if (!knowledgeBase) {
                throw new Error("Knowledge base not found");
            }

            const { answers } = (await this.aiService.getCustomAnswers(this.job!.custom_fields, knowledgeBase, this.job!.details)) || {};
            this.job!.custom_fields_answers = answers;
            this.spinner?.succeed(chalk.green("Custom fields processed."));
        } else {
            this.spinner?.succeed(chalk.green("No custom fields found."));
        }
    }

    private async askForModifications() {
        if (!this.page) {
            throw new Error("Page not initialized");
        }

        if (this.job?.custom_fields && this.job.custom_fields.length > 0) {
            const nextAction = await inquirer.prompt([
                {
                    type: "list",
                    name: "action",
                    message:
                        "Click on any of the questions to regenerate. If you are satisfied with the answers, press submit.",
                    choices: [
                        "All good, Proceed to Submit ✅",
                        ...this.job.custom_fields.map((field) => field.label)
                    ],
                },
            ]);

            if (nextAction.action === "All good, Proceed to Submit ✅") {
                return;
            } else {
                const { instructions } = await inquirer.prompt([
                    {
                        type: "input",
                        name: "instructions",
                        message: "Please write any instructions for the AI to regenerate the answer.",
                        default: "Make it better, please.",
                    },
                ]);

                const question = this.job.custom_fields.find(
                    (field) => field.label === nextAction.action
                );

                if (!question) {
                    throw new Error("Question not found");
                }

                const knowledgeBase = await this.fileSystemService.getKnowledgeBase();

                if (!knowledgeBase) {
                    throw new Error("Knowledge base not found");
                }

                const { answers } = (await this.aiService.getCustomAnswers([question], knowledgeBase, this.job.details, instructions)) || {};

                if (!answers || answers.length === 0) {
                    throw new Error("Answers not found");
                }

                await this.boardService?.fillField(this.page, question, answers[0].answer);

                console.log(chalk.cyan("Custom field updated."));
                await this.askForModifications();
            }
        }
    }

    private async submit() {
        this.spinner?.start("Submitting application...");

        await this.boardService?.submitApplication(this.page!);
        this.job!.status = "Applied";

        this.spinner?.succeed(chalk.green("Application submitted."));
    }
}