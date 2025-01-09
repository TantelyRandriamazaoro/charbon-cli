import Logs from "@/models/logs";
import sqlite3 from 'sqlite3';
import { Database, open } from 'sqlite';
import Job from "@/models/Job";
import { injectable } from "inversify";
import IDatabaseService from "@/models/IDatabaseService";
import { SearchEntry, SearchOptions, SearchResults } from "@/models/Search";

@injectable()
export default class SQLiteService implements IDatabaseService {
    private database: Database<sqlite3.Database, sqlite3.Statement> | undefined;

    constructor() {}

    async init(): Promise<void> {
        try {
            const database = await open({
                filename: 'data/db.sqlite',
                driver: sqlite3.Database,
            })

            this.database = database;

            console.log('Connected to sqlite database');
        } catch (err) {
            console.error(err);
        }

        return;
    }

    async getLastSearch(options: SearchOptions): Promise<SearchEntry | undefined> {
        try {
            const search = await this.database?.get(`SELECT * FROM search WHERE query = ? AND keywords = ? AND board = ? ORDER BY timestamp DESC LIMIT 1`, [options.query, options.keywords, options.board]);
            return search as SearchEntry;
        } catch (err) {
            console.error(err);
        }
    }

    async storeSearch(data: Logs): Promise<number | undefined> {
        try {
            const response = await this.database?.run(`INSERT INTO search (query, keywords, timestamp, page_number, board) VALUES (?, ?, ?, ?, ?)`, [data.query, data.keywords, data.timestamp, data.page_number, data.board]);
            return response?.lastID;
        } catch (err) {
            console.error(err);
        }
    }

    async storeDiscoveredJobs(data: Job[]) {
        try {
            const stmt = await this.database?.prepare(`INSERT INTO job (search_id, title, link, board, resume) VALUES (?, ?, ?, ?, ?)`);
            data.forEach((job) => {
                stmt?.run([job.search_id, job.title, job.link, job.board, job.resume]);
            });

            return;
        } catch (err) {
            console.error(err);
        }
    }

    async getDiscoveredJobs() {
        try {
            const jobs = await this.database?.all(`SELECT id, link FROM job WHERE status = 'Discovered'`);
            return jobs as Job[] || [];
        } catch (err) {
            console.error(err);
        }
    }

    async saveJobDetails(data: any) {
        return data;
    }
}