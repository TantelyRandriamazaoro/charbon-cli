import SQLiteAdapter from "@/services/adapters/sqlite.adapter";
import Logs from "@/models/logs";
import { injectable, inject } from "inversify";
import Job from "@/models/Job";

export interface DatabaseServiceAdapter {
    storeSearch: (data: any) => Promise<number | undefined>;
    storeDiscoveredJobs: (data: Job[]) => void;
    saveJobDetails: (data: any) => Promise<any>;
}

@injectable()
export default class DatabaseService implements DatabaseServiceAdapter {
    private adapter: SQLiteAdapter;

    constructor(options: { adapter: SQLiteAdapter }) {
        this.adapter = options.adapter;
    }

    async storeSearch(data: Logs) {
        return await this.adapter.storeSearch(data);
    }

    async storeDiscoveredJobs(data: Job[]) {
        this.adapter.storeDiscoveredJobs(data);
    }

    async saveJobDetails(data: any) {
        return data;
    }
}