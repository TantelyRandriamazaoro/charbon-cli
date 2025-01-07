import dotenv from 'dotenv';
dotenv.config();
import { google } from 'googleapis';
import Boards from '../../constants/boards';

export default class SearchService {

    constructor(
        private readonly apiKey: string,
        private readonly cx: string
    ) { }

    async query(query: string, options: { keywords: string; board: string; limit: string; }) {
        const customsearch = google.customsearch('v1');

        const fullQuery = this.buildQuery(options);

        const res = await customsearch.cse.list({
            auth: this.apiKey,
            cx: this.cx,
            q: `${query} ${fullQuery}`
        });

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