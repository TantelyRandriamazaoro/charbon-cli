import IDatabaseService from "@/models/IDatabaseService";
import InquirerService from "@/services/core/inquirer.service";
import boxen from "boxen";
import chalk from "chalk";
import { inject, injectable } from "inversify";

@injectable()
export default class ReviewController {
    constructor(
        @inject('DatabaseService') private databaseService: IDatabaseService,
        @inject(InquirerService) private inquirerService: InquirerService
    ) { }

    async init() {
        await this.databaseService.init();
    }

    async handle() {
        const reviewedJobs = [];

        try {
            const jobs = await this.databaseService.getPreparedJobs();

            if (!jobs || jobs.length === 0) {
                console.log('No jobs to review');
                return;
            }

            for (const job of jobs) {
                let output = '';

                output += chalk.blue(`Reviewing job: ${job.title}`) + '\n';
                output += chalk.green(job.link) + '\n\n';
                output += job.details?.summary + '\n\n';

                if (job.custom_fields) {
                    for (const question of job.custom_fields) {
                        const answer = job.custom_fields_answers?.find((a) => a.key === question.name);
                        output += chalk.yellow(question.label) + '\n';
                        output += (answer?.answer || 'No answer provided') + '\n\n';
                    }
                }

                // Wrap the entire job output in a box
                console.log(
                    boxen(output, {
                        padding: 1,
                        margin: 1,
                        borderStyle: 'round',
                        borderColor: 'cyan',
                    })
                );

                const ready = await this.inquirerService.askForReadiness();

                if (ready) {
                    console.log(chalk.green('Marking job application as reviewed and ready to submit...'));
                    reviewedJobs.push(job);
                } else {
                    console.log(chalk.red('Skipping job application'));
                }
            }

        } catch (err) {
            console.error(err);
        }

        await this.databaseService.updateReviewedJobs(reviewedJobs);
    }
}