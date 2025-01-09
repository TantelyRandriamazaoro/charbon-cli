import Job from "./Job";
import { SearchEntry, SearchOptions } from "./Search";

interface IDatabaseService {
    init(): Promise<void>;
    getLastSearch: (options: SearchOptions) => Promise<SearchEntry | undefined>;
    storeSearch: (data: any) => Promise<number | undefined>;
    storeDiscoveredJobs: (data: Job[]) => void;
    getDiscoveredJobs: () => Promise<Job[] | undefined>;
    saveJobDetails: (data: any) => Promise<any>;
}

export default IDatabaseService;