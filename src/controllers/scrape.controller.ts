import IDatabaseService from "@/models/IDatabaseService";
import { ScrapedJobDetails } from "@/models/Job";
import ScraperService from "@/services/core/scraper.service";
import TransformationService from "@/services/core/transformation.service";
import { inject, injectable } from "inversify";

@injectable()
export default class ScrapeController {
    constructor(
        @inject('DatabaseService') private databaseService: IDatabaseService,
        @inject(ScraperService) private scraperService: ScraperService,
        @inject(TransformationService) private transformationService: TransformationService
    ) { }

    async init() {
        await this.databaseService.init();
    }

    async handle(options?: { limit?: number }) {
        try {
            const jobs = await this.databaseService.getDiscoveredJobs();
    
            if (!jobs || jobs?.length === 0) {
                console.log('No jobs to scrape');
                return;
            }
    
            const data = await this.scraperService.batchScrape(jobs);

            await this.databaseService.updateScrapedJobs(data);

            console.log('Job scraping completed successfully');

            
        } catch (error) {
            console.error('An error occurred during scraping:', error);
        } finally {

        }
    }
}