import IDatabaseService from "@/models/IDatabaseService";
import InquirerService from "@/services/core/inquirer.service";
import buildMultilineOutput from "@/utils/buildMultilineOutput";
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
        try {
            const jobs = await this.databaseService.getPreparedJobs();

            if (!jobs || jobs.length === 0) {
                console.log('No jobs to review');
                return;
            }

            for (const job of jobs) {
                const { details, custom_fields, custom_fields_answers, title, link } = job;
                const { getOutput, append } = buildMultilineOutput();

                // Main job details
                append(`Reviewing job: ${title}`, chalk.blue);
                append(link, chalk.green);
                append(details?.summary);

                // Optional job details

                if (details?.location) append({ label: 'Location', message: details.location }, chalk.cyan);

                if (details?.remote) append({ label: 'Remote', message: String(details.remote) }, chalk.cyan);

                if (details?.job_type) append({ label: 'Job type', message: details.job_type }, chalk.cyan);

                if (details?.experience) append({ label: 'Experience level', message: details.experience }, chalk.cyan);

                if (details?.salary) append({ label: 'Salary', message: details.salary }, chalk.cyan);

                if (details?.technical_skills) append({ label: 'Technical Skills', message: details.technical_skills.join(' | ') }, chalk.cyan);

                // Custom fields
                if (custom_fields) {
                    for (const question of custom_fields) {
                        const answer = custom_fields_answers?.find((a) => a.key === question.name);
                        append(question.label, chalk.yellow);
                        append(answer?.answer || 'No answer provided');
                    }
                }

                // Wrap the entire job output in a box
                console.log(
                    boxen(getOutput(), {
                        padding: 1,
                        margin: 1,
                        borderStyle: 'round',
                        borderColor: 'cyan',
                    })
                );

                const status = await this.inquirerService.askForStatus(job);
                await this.databaseService.updateJobStatus(job, status);
            }

        } catch (err) {
            console.error(err);
        }
    }
}