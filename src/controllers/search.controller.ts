import Boards from "@/models/boards";
import { inject, injectable } from "inversify";
import LogService from "@/services/log.service";
import DatabaseService from "@/services/database.service";
import SearchService from "@/services/search.service";
import TransformationService from "@/services/transformation.service";

@injectable()
export default class SearchController {
    constructor(
        @inject(LogService) private logService: LogService,
        @inject(DatabaseService) private databaseService: DatabaseService,
        @inject(SearchService) private searchService: SearchService,
        @inject(TransformationService) private transformationService: TransformationService
    ) {}

    async handle (query: string, options: { keywords: string; board: Boards; limit: string; }) {
        const searchResults = await this.searchService.query(query, options);
        const transformedResults = await this.transformationService.searchResults(searchResults || []);

        console.log(transformedResults);
    }
}