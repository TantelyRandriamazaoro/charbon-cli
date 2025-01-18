import Job, { NormalizedCustomField, ScrapedJobDetails } from "./Job";
import { SearchEntry, SearchOptions } from "./Search";
import Status from "./Status";

interface IDatabaseService {
    init(): Promise<void>;
    getLastSearch: (query: string, options: SearchOptions) => Promise<SearchEntry | undefined>;
    storeSearch: (data: SearchEntry) => Promise<number | undefined>;
    storeDiscoveredJobs: (data: Job[]) => Promise<{ success: Job[]; duplicates: number; total: number }>;
    getDiscoveredJob: () => Promise<Job | undefined>;
    getDiscoveredJobs: (limit: number) => Promise<Job[] | undefined>;
    getScrapedJobs: () => Promise<Job[]>;
    getPreparedJobs: () => Promise<Job[]>;
    getReviewedJobs: () => Promise<Job[]>;
    updateScrapedJobs: (data: ScrapedJobDetails[]) => Promise<void>;
    updateFailedJobs: (data: Job[]) => Promise<void>;
    updatePreparedJobs: (data: Job[]) => Promise<void>;
    updateJobStatus: (data: Job, status: Status) => Promise<void>;
    updateJob: (data: Job) => Promise<void>;
}

export default IDatabaseService;