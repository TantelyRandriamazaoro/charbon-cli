import SearchResults from "@/models/SearchResults"
import Boards from "@/models/boards";
import { ScrapedData } from "./scraper.service";

export default class TransformationService {
    constructor() { }

    isValidBoardUrl(board: Boards, url?: string | null) {
        if (!url) {
            return false;
        }

        switch (board) {
            case 'lever':
                // Lever job posting URLs are in the format: https://jobs.lever.co/{company}/{job_id}/{apply}
                const regex = /^https:\/\/jobs\.lever\.co\/[a-zA-Z0-9\-]+\/[a-f0-9\-]{36}(\/apply)?$/;
                return regex.test(url);
            case 'greenhouse':
                // Greenhouse job posting URLs are in the format: https://boards.greenhouse.io/{company}/jobs/{job_id}
                const regex2 = /^https:\/\/boards\.greenhouse\.io\/[a-zA-Z0-9\-]+\/jobs\/[0-9]+$/;
                return regex2.test(url);
            case 'workable':
                // Workable job posting URLs are in the format: https://apply.workable.com/{company}/j/{job_id}
                const regex3 = /^https:\/\/apply\.workable\.com\/[a-zA-Z0-9\-]+\/j\/[a-f0-9\-]{36}$/;
                return regex3.test(url);
            default:
                return false;
        }
    }

    cleanBoardUrl(board: Boards, url?: string | null) {
        if (!url) {
            throw new Error('URL is required');
        }

        switch (board) {
            case 'lever':
                return url.replace(/\/apply$/, '');
            case 'greenhouse':
                return url.replace(/\/jobs\/[0-9]+$/, '');
            case 'workable':
                return url.replace(/\/j\/[a-f0-9\-]{36}$/, '');
            default:
                return url;
        }
    }

    async searchResults(data: SearchResults) {
        return data.items
            .filter((item) => {
                return item.link && this.isValidBoardUrl(data.board, item.link);
            })
            .map((item) => {
                return {
                    search_id: data.id,
                    board: data.board,
                    title: item.title || '',
                    link: this.cleanBoardUrl(data.board, item.link)
                }
            })
    }

    async scrapedLeverData(data: ScrapedData) {
        
    }
}