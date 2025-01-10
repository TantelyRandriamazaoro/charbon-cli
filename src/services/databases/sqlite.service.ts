import Logs from "@/models/logs";
import sqlite3 from 'sqlite3';
import { Database, open } from 'sqlite';
import Job, { ScrapedJobDetails } from "@/models/Job";
import { injectable } from "inversify";
import IDatabaseService from "@/models/IDatabaseService";
import { SearchEntry, SearchOptions, SearchResults } from "@/models/Search";

@injectable()
export default class SQLiteService implements IDatabaseService {
    private database: Database<sqlite3.Database, sqlite3.Statement> | undefined;

    constructor() { }

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

    async getLastSearch(query: string, options: SearchOptions): Promise<SearchEntry | undefined> {
        try {
            let sql = `
                SELECT * 
                FROM search 
                WHERE query = ? 
            `;
            const params: any[] = [query];

            if (options.keywords) {
                sql += `AND keywords = ? `;
                params.push(options.keywords);
            } else {
                sql += `AND (keywords IS NULL OR keywords = '') `;
            }

            sql += `AND board = ? 
                    ORDER BY timestamp DESC 
                    LIMIT 1`;
            params.push(options.board);

            const search = await this.database?.get(sql, params);
            return search as SearchEntry;
        } catch (err) {
            console.error(err);
        }
    }


    async storeSearch(data: SearchEntry): Promise<number | undefined> {
        try {
            const response = await this.database?.run(`INSERT INTO search (query, keywords, starts_at, board) VALUES (?, ?, ?, ?)`, [data.query, data.keywords, data.starts_at, data.board]);
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
            const jobs = await this.database?.all(`SELECT id, title, link FROM job WHERE status = 'Discovered' LIMIT 10`);
            return jobs as Job[] || [];
        } catch (err) {
            console.error(err);
        }
    }

    async updateScrapedJobs(data: ScrapedJobDetails[]) {
        try {
            // update the status, details, description, and custom fields
            const stmt = await this.database?.prepare(`UPDATE job SET status = 'Scraped', description = ?, details = ?, custom_fields = ? WHERE id = ?`);
            data.forEach((job) => {
                stmt?.run([job.description, JSON.stringify(job.details), JSON.stringify(job.custom_fields), job.job_id]);
            });

            return;
        } catch (err) {
            console.error(err);
        }
    }

    async saveJobDetails(data: any) {
        return data;
    }
}