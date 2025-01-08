import IDatabaseService from "@/models/IDatabaseService";
import ScraperService from "@/services/scraper.service";
import TransformationService from "@/services/transformation.service";
import { inject, injectable } from "inversify";

@injectable()
export default class ScrapeController {
    constructor(
        @inject(ScraperService) private scraperService: ScraperService,
        @inject(TransformationService) private transformationService: TransformationService,
        @inject('DatabaseService') private databaseService: IDatabaseService
    ) { }

    async handle(options?: { limit?: number }) {


        const jobs = await this.databaseService.getDiscoveredJobs();

        const scrapedJobs: any = [];

        jobs?.forEach(async (job) => {
            const scrapedData = await this.scraperService.scrape(job.link);
            console.log('Finished scraping', job.link);
            scrapedJobs.push(scrapedData);
        });

        console.log(JSON.stringify(scrapedJobs));
    }
}