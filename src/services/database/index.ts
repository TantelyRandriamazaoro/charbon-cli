import Logs from "@/models/logs";
import SQLiteAdapter from "./sqlite";

export interface DatabaseServiceAdapter {
    saveSearchLogs: (data: any) => Promise<any>;
    saveSearchResults: (data: any) => Promise<any>;
    saveJobDetails: (data: any) => Promise<any>;
}


export default class DatabaseService implements DatabaseServiceAdapter {
    private adapter: SQLiteAdapter;

    constructor(type: 'sqlite' | 'mysql') {
        switch (type) {
            case 'sqlite':
                this.adapter = new SQLiteAdapter();
                break;
            case 'mysql':
                this.adapter = new SQLiteAdapter();
                break;
            default:
                this.adapter = new SQLiteAdapter();
        }
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