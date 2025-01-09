import { google } from 'googleapis';
import Boards from '@constants/boards';
import _Boards from '@/models/boards';
import { injectable, inject } from "inversify";
import { SearchResults } from '@/models/Search';
import IDatabaseService from '@/models/IDatabaseService';

@injectable()
export default class SearchService {
    private apiKey: string;
    private cx: string;

    constructor(
        @inject('DatabaseService') private databaseService: IDatabaseService,
        options: { apiKey: string; id: string; }
    ) {
        this.apiKey = options.apiKey;
        this.cx = options.id;
    }

    async query(query: string, options: { keywords: string; board: _Boards; limit: string; }): Promise<SearchResults> {
        const customsearch = google.customsearch('v1');

        const fullQuery = this.buildQuery(options);

        const res = await customsearch.cse.list({
            auth: this.apiKey,
            cx: this.cx,
            q: `${query} ${fullQuery}`
        });

        const search_id = await this.storeSearch(query, options);

        return {
            id: search_id || 0,
            board: options.board,
            items: res.data.items || []
        }
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

    async storeSearch(query: string, options: { keywords: string; board: _Boards; limit: string; }) {
        const searchLogs = {
            query: query.toLowerCase(),
            keywords: options.keywords,
            timestamp: new Date(),
            page_number: 1,
            board: options.board
        };

        return await this.databaseService.storeSearch(searchLogs);
    }
}