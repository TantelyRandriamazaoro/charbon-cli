import Job from "./Job";

interface IDatabaseService {
    connect(): Promise<void>;
    storeSearch: (data: any) => Promise<number | undefined>;
    storeDiscoveredJobs: (data: Job[]) => void;
    getDiscoveredJobs: () => Promise<Job[] | undefined>;
    saveJobDetails: (data: any) => Promise<any>;
}

export default IDatabaseService;