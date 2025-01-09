import IDatabaseService from "@/models/IDatabaseService";
import ScraperService from "@/services/scraper.service";
import TransformationService from "@/services/transformation.service";
import { inject, injectable } from "inversify";

@injectable()
export default class ScrapeController {
    constructor(
        @inject('DatabaseService') private databaseService: IDatabaseService,
        @inject(ScraperService) private scraperService: ScraperService,
        @inject(TransformationService) private transformationService: TransformationService
    ) { }

    async handle(options?: { limit?: number }) {
        await this.databaseService.init();
        const jobs = await this.databaseService.getDiscoveredJobs();

        if (!jobs || jobs?.length === 0) {
            console.log('No jobs to scrape');
            return;
        }

        this.scraperService.batchScrape(jobs)

        console.log(JSON.stringify(jobs));
    }
}