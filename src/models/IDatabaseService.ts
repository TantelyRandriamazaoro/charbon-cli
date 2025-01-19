import Job, { NormalizedCustomField, ScrapedJobDetails } from "./Job";
import { SearchEntry, SearchOptions } from "./Search";
import Status from "./Status";

interface IDatabaseService {
    init(): Promise<void>;
    getLastSearch: (query: string, options: SearchOptions) => Promise<SearchEntry | undefined>;
    storeSearch: (data: SearchEntry) => Promise<number | undefined>;
    storeJobs: (data: Job[]) => Promise<{ success: Job[]; duplicates: number; total: number }>;
    getJob: (options: { status: Status, excludeFields?: (keyof Job)[] }) => Promise<Job | undefined>;
    getJobs: (options: { status: Status, limit: number }) => Promise<Job[] | undefined>;
    updateJob: (data: Job) => Promise<void>;
}

export default IDatabaseService;