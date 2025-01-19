import Logs from "@/models/logs";
import sqlite3 from 'sqlite3';
import { Database, open } from 'sqlite';
import Job, { NormalizedCustomField, ScrapedJobDetails } from "@/models/Job";
import { injectable } from "inversify";
import IDatabaseService from "@/models/IDatabaseService";
import { SearchEntry, SearchOptions, SearchResults } from "@/models/Search";
import Status from "@/models/Status";

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
                    AND country = ?
                    AND location_type = ?
                    ORDER BY timestamp DESC 
                    LIMIT 1`;
            params.push(options.board);
            params.push(options.country);
            params.push(options.location_type);

            const search = await this.database?.get(sql, params);
            return search as SearchEntry;
        } catch (err) {
            console.error(err);
        }
    }


    async storeSearch(data: SearchEntry): Promise<number | undefined> {
        try {
            const response = await this.database?.run(`INSERT INTO search (query, keywords, starts_at, board, country, location_type) VALUES (?, ?, ?, ?, ?, ?)`, [data.query?.toLowerCase(), data.keywords?.toLowerCase(), data.starts_at, data.board, data.country, data.location_type]);
            return response?.lastID;
        } catch (err) {
            console.error(err);
        }
    }

    async getJob(options: { status: Status, excludeFields?: (keyof Job)[] }) {
        try {
            let sql = `SELECT * FROM job WHERE status = ? LIMIT 1`;
            const job = await this.database?.get(sql, [options.status]);

            return {
                ...job,
                details: JSON.parse(job.details) || {},
                custom_fields: JSON.parse(job.custom_fields) || [],
                custom_fields_answers: JSON.parse(job.custom_fields_answers) || [],
            } as Job;
        } catch (err) {
            console.error(err);
        }
    }

    async getJobs(options: { status: Status, limit: number }) {
        try {
            let sql = `SELECT * FROM job WHERE status = ? LIMIT ?`;
            const jobs = await this.database?.all(sql, [options.status, options.limit]);

            return jobs!.map((job) => {
                return {
                    ...job,
                    details: JSON.parse(job.details) || {},
                    custom_fields: JSON.parse(job.custom_fields) || [],
                    custom_fields_answers: JSON.parse(job.custom_fields_answers) || [],
                };
            }) as Job[];
        } catch (err) {
            console.error(err);
        }
    }

    async updateJob(data: Job) {
        try {
            const stmt = await this.database?.prepare(`UPDATE job SET description = ?, details = ?, custom_fields = ?, custom_fields_answers = ?, resume = ?, status = ? WHERE id = ?`);
            stmt?.run([
                data.description,
                JSON.stringify(data.details || {}),
                JSON.stringify(data.custom_fields || []),
                JSON.stringify(data.custom_fields_answers || []),
                data.resume,
                data.status,
                data.id,
            ]);
        } catch (err) {
            console.error(err);
        }
    }

    async storeJobs(data: Job[]) {
        const stmt = await this.database?.prepare(`INSERT INTO job (search_id, title, link, board, resume) VALUES (?, ?, ?, ?, ?)`);

        let success: Job[] = [];
        let duplicates: number = 0;
        for (const job of data) {
            try {
                await stmt?.run([job.search_id, job.title, job.link, job.board, job.resume]);
                success.push(job);
            }
            catch (err: any) {
                if (err.code === 'SQLITE_CONSTRAINT') {
                    duplicates++;
                    continue;
                }
            }
        }

        return {
            success,
            duplicates,
            total: data.length
        }
    }

}