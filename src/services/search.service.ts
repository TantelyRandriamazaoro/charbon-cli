import { google } from 'googleapis';
import Boards from '@constants/boards';
import _Boards from '@/models/boards';
import { injectable, inject } from "inversify";
import LogService from './log.service';
import DatabaseService from './database.service';

@injectable()
export default class SearchService {
    private apiKey: string;
    private cx: string;

    constructor(
        @inject(LogService) private logService: LogService,
        @inject(DatabaseService) private databaseService: DatabaseService,
        options: { apiKey: string; id: string; }
    ) {
        this.apiKey = options.apiKey;
        this.cx = options.id;
    }

    async query(query: string, options: { keywords: string; board: _Boards; limit: string; }) {
        const customsearch = google.customsearch('v1');

        const fullQuery = this.buildQuery(options);

        const res = await customsearch.cse.list({
            auth: this.apiKey,
            cx: this.cx,
            q: `${query} ${fullQuery}`
        });

        await this.logService.logSearch(query, options);

        return res.data.items;
    }

    private buildQuery(options: { keywords: string; board: string; }) {
        const keywords = options.keywords ? options.keywords.split(',').map((keyword) => `"${keyword}"`).join(' ') : '';
        let board = 'site:';

        switch (options.board) {
            case 'lever':
                board += Boards.LEVER
                break;
            case 'greenhouse':
                board += Boards.GREENHOUSE
                break;
            case 'workable':
                board += Boards.WORKABLE
                break;
            default:
                board += Boards.LEVER
        }

        return `${keywords} ${board}`;
    }
}