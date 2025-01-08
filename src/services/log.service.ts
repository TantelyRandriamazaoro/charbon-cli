import { injectable, inject } from "inversify";

import Logs from "@/models/logs";
import Boards from "@/models/boards";
import IDatabaseService from "@/models/IDatabaseService";

@injectable()
export default class LogService {
    constructor(@inject('DatabaseService') private databaseService: IDatabaseService) {}

    async logSearch(query: string, options: { keywords: string; board: Boards; limit: string; }) {
        
    }

    async logAiExecution(data: string) {

    }
}