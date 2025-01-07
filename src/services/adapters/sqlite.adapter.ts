import Logs from "@/models/logs";
import sqlite3 from 'sqlite3';
import { Database, open } from 'sqlite';
import { DatabaseServiceAdapter } from "../database.service";

export default class SQLiteAdapter implements DatabaseServiceAdapter {
    private database: Database<sqlite3.Database, sqlite3.Statement> | undefined;

    constructor() {
        open({
            filename: 'data/db.sqlite',
            driver: sqlite3.Database,
        }).then((db) => {
            if (!db) {
                throw new Error('Database not found');
            }

            this.database = db;
            console.log('Connected to sqlite database');
        }).catch((err) => {
            console.error(err);
        });
    }

    async saveSearchLogs(data: Logs) {
        try {
            await this.database?.run(`INSERT INTO search_logs (query, keywords, timestamp, page_number, board) VALUES (?, ?, ?, ?, ?)`, [data.query, data.keywords, data.timestamp, data.page_number, data.board]);
            console.log('Saved search logs');
        } catch (err) {
            console.error(err);
        }
    }

    async saveSearchResults(data: any) {
        return data;
    }

    async saveJobDetails(data: any) {
        return data;
    }
}