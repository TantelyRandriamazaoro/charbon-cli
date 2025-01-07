import { DatabaseServiceAdapter } from ".";
import { Database } from "sqlite3";
import path from "path";
import Logs from "@/models/logs";

export default class SQLiteAdapter implements DatabaseServiceAdapter {
    private database: Database;
    
    constructor() {
        this.database = new Database(path.resolve(__dirname, '../../../data/database.sqlite'));
    }

    async saveSearchLogs(data: Logs) {
        this.database.run(`INSERT INTO logs (query, keywords, timestamp, page_number, board) VALUES (?, ?, ?, ?, ?)`, [data.query, data.keywords, data.timestamp, data.page_number, data.board]);
        console.log('Saved search logs');
    }

    async saveSearchResults(data: any) {
        return data;
    }

    async saveJobDetails(data: any) {
        return data;
    }
}