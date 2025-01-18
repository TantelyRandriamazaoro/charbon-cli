import { google } from 'googleapis';
import Boards from '@constants/boards';
import _Boards from '@/models/boards';
import { injectable, inject } from "inversify";
import { SearchEntry, SearchOptions, SearchResults } from '@/models/Search';
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

    async query(query: string, options: SearchOptions): Promise<SearchResults> {
        const customsearch = google.customsearch('v1');

        const fullQuery = this.buildQuery(options);

        const res = await customsearch.cse.list({
            auth: this.apiKey,
            cx: this.cx,
            q: `${query} ${fullQuery}`,
            start: options.starts_at || 1,
            gl: options.country === 'global' ? undefined : options.country,
        });

        const search_id = await this.storeSearch(query, options);

        return {
            id: search_id || 0,
            board: options.board,
            items: res.data.items || []
        }
    }

    private buildQuery(options: SearchOptions): string {
        const keywords = options.keywords ? options.keywords.split(',').map((keyword) => `"${keyword}"`).join(' ') : '';
        const country = options.country === 'global' ? '' : `"${options.country}"`;
        const location_type = `"${options.location_type}"`;

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

        return `${keywords} ${location_type} ${country} ${board}`;
    }

    async storeSearch(query: string, options: SearchOptions) {
        const searchEntry: SearchEntry = {
            ...options,
            query: query.toLowerCase(),
            country: options.country || 'global',
            country_name: options.country_name
        };

        return await this.databaseService.storeSearch(searchEntry);
    }
}