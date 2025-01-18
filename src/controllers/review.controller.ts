import IDatabaseService from "@/models/IDatabaseService";
import InquirerService from "@/services/core/inquirer.service";
import LogService from "@/services/core/log.service";
import buildMultilineOutput from "@/utils/buildMultilineOutput";
import boxen from "boxen";
import chalk from "chalk";
import { inject, injectable } from "inversify";

@injectable()
export default class ReviewController {
    constructor(
        @inject('DatabaseService') private databaseService: IDatabaseService,
        @inject(InquirerService) private inquirerService: InquirerService,
        @inject(LogService) private logService: LogService
    ) { }

    async init() {
        await this.databaseService.init();
    }

    async handle() {
        try {
            const jobs = await this.databaseService.getPreparedJobs();

            if (!jobs || jobs.length === 0) {
                console.log('No jobs to review');
                return;
            }

            for (const job of jobs) {
                this.logService.logJobDetails(job);
                const status = await this.inquirerService.askForStatus(job);
                await this.databaseService.updateJobStatus(job, status);
            }

        } catch (err) {
            console.error(err);
        }
    }
}