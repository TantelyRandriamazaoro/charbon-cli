import * as env from "@/env"
import Logs from "@/models/logs";
import Boards from "@/models/boards";
import DatabaseService from "@/services/database";
import SearchService from "@services/search";
import TransformationService from "@services/transformation";

export default async function search(query: string, options: { keywords: string; board: Boards; limit: string; }) {
    const search = new SearchService(env.GOOGLE_CUSTOM_SEARCH_API_KEY, env.GOOGLE_CUSTOM_SEARCH_CX);
    const transform = new TransformationService();
    const database = new DatabaseService('sqlite');

    const searchResults = await search.query(query, options);
    const transformedResults = await transform.searchResults(searchResults || []);

    console.log(transformedResults);

    const searchLogs: Logs = {
        query: query.toLowerCase(),
        keywords: options.keywords,
        timestamp: new Date(),
        page_number: 1,
        board: options.board
    };

    await database.saveSearchLogs(searchLogs);
}