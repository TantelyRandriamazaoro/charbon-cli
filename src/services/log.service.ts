import { injectable, inject } from "inversify";
import DatabaseService from "./database.service";
import Logs from "@/models/logs";
import Boards from "@/models/boards";

@injectable()
export default class LogService {
    constructor(@inject(DatabaseService) private databaseService: DatabaseService) {}

    async logSearch(query: string, options: { keywords: string; board: Boards; limit: string; }) {
        const searchLogs: Logs = {
            query: query.toLowerCase(),
            keywords: options.keywords,
            timestamp: new Date(),
            page_number: 1,
            board: options.board
        };

        await this.databaseService.saveSearchLogs(searchLogs);
    }
}