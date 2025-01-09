import Boards from "@/models/boards";
import { inject, injectable } from "inversify";
import SearchService from "@/services/search.service";
import TransformationService from "@/services/transformation.service";
import IDatabaseService from "@/models/IDatabaseService";
import FileSystemService from "@/services/filesystem.service";

@injectable()
export default class SearchController {
    constructor(
        @inject(FileSystemService) private filesystemService: FileSystemService,
        @inject(SearchService) private searchService: SearchService,
        @inject(TransformationService) private transformationService: TransformationService,
        @inject('DatabaseService') private databaseService: IDatabaseService
    ) {}

    async handle (query: string, options: { keywords: string; board: Boards; limit: string; }) {
        await this.databaseService.init();
        const resume = await this.filesystemService.pickResume();

        const searchResults = await this.searchService.query(query, options);
        const transformedResults = await this.transformationService.searchResults({...searchResults, resume });

        if (transformedResults.length === 0) {
            console.log('No results found');
            return;
        }

        this.databaseService.storeDiscoveredJobs(transformedResults);
        console.log(transformedResults);
    }
}