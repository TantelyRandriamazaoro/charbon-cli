import { injectable, inject } from "inversify";
import DatabaseService from "./database.service";
import Logs from "@/models/logs";
import Boards from "@/models/boards";

@injectable()
export default class LogService {
    constructor(@inject(DatabaseService) private databaseService: DatabaseService) {}

    async logSearch(query: string, options: { keywords: string; board: Boards; limit: string; }) {
        
    }
}