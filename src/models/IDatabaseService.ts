import Job, { NormalizedCustomField, ScrapedJobDetails } from "./Job";
import { SearchEntry, SearchOptions } from "./Search";

interface IDatabaseService {
    init(): Promise<void>;
    getLastSearch: (query: string, options: SearchOptions) => Promise<SearchEntry | undefined>;
    storeSearch: (data: SearchEntry) => Promise<number | undefined>;
    storeDiscoveredJobs: (data: Job[]) => Promise<void>;
    getDiscoveredJobs: () => Promise<Job[] | undefined>;
    updateScrapedJobs: (data: ScrapedJobDetails<NormalizedCustomField>[]) => Promise<void>;
    updateFailedJobs: (data: Job[]) => Promise<void>;
    saveJobDetails: (data: any) => Promise<any>;
}

export default IDatabaseService;