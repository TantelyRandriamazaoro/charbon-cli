import IDatabaseService from "@/models/IDatabaseService";
import Job from "@/models/Job";
import AiService from "@/services/core/ai.service";
import FileSystemService from "@/services/core/filesystem.service";
import TransformationService from "@/services/core/transformation.service";
import chalk from "chalk";
import { inject, injectable } from "inversify";
import ora from "ora";

@injectable()
export default class PrepareController {
    constructor(
        @inject(AiService) private aiService: AiService,
        @inject(FileSystemService) private fileSystemService: FileSystemService,
        @inject(TransformationService) private transformationService: TransformationService,
        @inject('DatabaseService') private databaseService: IDatabaseService
    ) { }

    async init() {
        await this.databaseService.init();
    }

    async handle() {
        const spinner = ora('Preparing jobs...').start();
        try {
            spinner.text = 'Getting knowledge base...';
            const knowledgeBase = await this.fileSystemService.getKnowledgeBase();


            if (!knowledgeBase) {
                spinner.fail('Knowledge base not found');
                throw new Error('Knowledge base not found');
            }

            spinner.text = 'Getting scraped jobs...';
            const scrapedJobs = await this.databaseService.getScrapedJobs();

            if (!scrapedJobs) {
                spinner.fail('Scraped jobs not found');
                throw new Error('Scraped jobs not found');
            }

            const filteredJobs = scrapedJobs.filter(job => job.custom_fields && job.custom_fields?.length > 0);

            const preparedJobs: Job[] = scrapedJobs.filter(job => !job.custom_fields || job.custom_fields?.length === 0);

            spinner.succeed(`Preliminary preparation complete. Found ${filteredJobs.length} jobs with custom fields. Ignoring ${preparedJobs.length} jobs without custom fields.`);
            spinner.stop();

            console.log(` `)
            console.log(` `)
            for (const job of filteredJobs) {
                console.log('-------------------------');
                console.log(chalk.blue('Preparing', job.title));
                console.log(chalk.green(job.link));

                if (!job.custom_fields) {
                    continue;
                }
                spinner.start();
                spinner.text = `Generating answers...`;
                const rawCustomAnswers = await this.aiService.getCustomAnswers(job.custom_fields, knowledgeBase);
                spinner.succeed('Answers generated');

                job.custom_fields_answers = rawCustomAnswers?.answers;
                preparedJobs.push(job);

                spinner.stop();
            }
            console.log("-------------------------");

            spinner.start();
            spinner.text = 'Storing prepared jobs...';
            await this.databaseService.updatePreparedJobs(preparedJobs);
            spinner.succeed('Jobs prepared');

            spinner.stop();
        } catch (error) {
            console.error(error);
        }
    }
}