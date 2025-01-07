import { inject, injectable } from "inversify";
import DatabaseService from "./database.service";
import OpenAI from "openai";

@injectable()
export default class AiService {
    private openai: OpenAI;

    constructor(
        @inject(DatabaseService) private databaseService: DatabaseService,
        options: { apiKey: string; }
    ) {
        this.openai = new OpenAI({ apiKey: options.apiKey });
    }
}