import SQLiteAdapter from "@/services/adapters/sqlite.adapter";
import Logs from "@/models/logs";
import { injectable, inject } from "inversify";

export interface DatabaseServiceAdapter {
    saveSearchLogs: (data: any) => Promise<any>;
    saveSearchResults: (data: any) => Promise<any>;
    saveJobDetails: (data: any) => Promise<any>;
}

@injectable()
export default class DatabaseService implements DatabaseServiceAdapter {
    private adapter: SQLiteAdapter;

    constructor(options: { adapter: SQLiteAdapter }) {
        this.adapter = options.adapter;
    }

    async saveSearchLogs(data: Logs) {
        this.adapter.saveSearchLogs(data);
    }

    async saveSearchResults(data: any) {
        return data;
    }

    async saveJobDetails(data: any) {
        return data;
    }
}