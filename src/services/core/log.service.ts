import { injectable, inject } from "inversify";

import Logs from "@/models/logs";
import Boards from "@/models/boards";
import IDatabaseService from "@/models/IDatabaseService";
import buildMultilineOutput from "@/utils/buildMultilineOutput";
import Job, { JobDetails } from "@/models/Job";
import chalk from "chalk";
import boxen from "boxen";

@injectable()
export default class LogService {
    constructor(@inject('DatabaseService') private databaseService: IDatabaseService) { }

    async logSearch(query: string, options: { keywords: string; board: Boards; limit: string; }) {

    }

    async logAiExecution(data: string) {

    }

    logJobDetails(job: Job) {
        const { getOutput, append } = buildMultilineOutput();

        const details = job.details as JobDetails;

        append(`Reviewing job: ${job?.title}`, chalk.blue);
        append(job?.link, chalk.green);
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

        if (details?.technical_skills)
            append(
                { label: "Technical Skills", message: details.technical_skills.join(" | ") },
                chalk.cyan
            );

        if (job.resume) append({ label: "Using resume:", message: job.resume }, chalk.yellow);

        console.log(
            boxen(getOutput(), {
                padding: 1,
                margin: 1,
                borderStyle: "round",
                borderColor: "cyan",
            })
        );
    }
}