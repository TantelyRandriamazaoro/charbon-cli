import { inject, injectable } from "inversify";
import DatabaseService from "./database.service";

@injectable()
export default class AiService {
    constructor(
        @inject(DatabaseService) private databaseService: DatabaseService,
        options: { apiKey: string; }
    ) {

    }
}