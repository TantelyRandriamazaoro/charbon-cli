import IDatabaseService from "@/models/IDatabaseService";
import { ScrapedJobDetails } from "@/models/Job";
import BrowserService from "@/services/core/browser.service";
import TransformationService from "@/services/core/transformation.service";
import { inject, injectable } from "inversify";

@injectable()
export default class ScrapeController {
    constructor(
        @inject('DatabaseService') private databaseService: IDatabaseService,
        @inject(BrowserService) private browserService: BrowserService,
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
    
            const { data, failed } = await this.browserService.batchScrape(jobs);
            const transformedData = this.transformationService.transformScrapedJobs(data);


            await this.databaseService.updateScrapedJobs(transformedData);
            await this.databaseService.updateFailedJobs(failed);

            console.log('Job scraping completed successfully');

            
        } catch (error) {
            console.error('An error occurred during scraping:', error);
        } finally {

        }
    }
}