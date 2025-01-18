import IDatabaseService from "@/models/IDatabaseService";
import BrowserService from "@/services/core/browser.service";
import FileSystemService from "@/services/core/filesystem.service";
import InquirerService, { Actions } from "@/services/core/inquirer.service";
import LogService from "@/services/core/log.service";
import buildMultilineOutput from "@/utils/buildMultilineOutput";
import boxen from "boxen";
import chalk from "chalk";
import { inject, injectable } from "inversify";
import { Page } from "puppeteer";

@injectable()
export default class ReviewController {
    private page: Page | null = null;

    constructor(
        @inject('DatabaseService') private databaseService: IDatabaseService,
        @inject(InquirerService) private inquirerService: InquirerService,
        @inject(LogService) private logService: LogService,
        @inject(BrowserService) private browserService: BrowserService,
        @inject(FileSystemService) private fileSystemService: FileSystemService
    ) { }

    async init() {
        await this.databaseService.init();
        await this.browserService.init({ headless: false });
    }

    async handle() {
        try {
            const jobs = await this.databaseService.getScrapedJobs();


            const page = await this.browserService.newPage();
            await page.setViewport({ width: 1280, height: 1024, deviceScaleFactor: 1 });

            if (!jobs || jobs.length === 0) {
                console.log('No jobs to review');
                return;
            }

            for (const job of jobs) {

                console.clear();
                this.logService.logJobDetails(job);
                
                await page.goto(job.link, { waitUntil: 'domcontentloaded' });

                const action = await this.inquirerService.askForAction();

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
            }

        } catch (err) {
            console.error(err);
        }

        return;
    }
}