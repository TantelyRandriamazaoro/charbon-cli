import Boards from "@/models/boards";
import { inject, injectable } from "inversify";
import SearchService from "@/services/search.service";
import TransformationService from "@/services/transformation.service";
import IDatabaseService from "@/models/IDatabaseService";
import FileSystemService from "@/services/filesystem.service";
import InquirerService from "@/services/inquirer.service";
import chalk from "chalk";
import { SearchOptions } from "@/models/Search";

@injectable()
export default class SearchController {
    constructor(
        @inject(InquirerService) private inquirerService: InquirerService,
        @inject(FileSystemService) private filesystemService: FileSystemService,
        @inject(SearchService) private searchService: SearchService,
        @inject(TransformationService) private transformationService: TransformationService,
        @inject('DatabaseService') private databaseService: IDatabaseService
    ) { }

    async init() {
        await this.databaseService.init();
    }

    async handle(query: string, options: SearchOptions) {
        let starts_at = 1;
        let page_number = 1;
        try {
            if (!options.board) {
                const selectedBoard = await this.inquirerService.askForJobBoard();
                options.board = selectedBoard as Boards;
            }

            const lastQuery = await this.databaseService.getLastSearch(query.toLocaleLowerCase(), options);

            if (lastQuery) {
                starts_at = lastQuery.starts_at + 10;
                page_number = Math.floor(starts_at / 10) + 1;

                if (starts_at > 91) {
                    console.log('Max pages reached.');
                    return;
                }
            }

            if (!options.resume) {
                const resumes = await this.filesystemService.listResume();
                if (!resumes) {
                    console.log('No resumes found');
                    return;
                }
                const selectedResume = await this.inquirerService.askForResume(resumes);
                options.resume = selectedResume;
            }

            const searchResults = await this.searchService.query(query, { ...options, starts_at });
            const transformedResults = await this.transformationService.searchResults({ ...searchResults, resume: options.resume });

            if (transformedResults.length === 0) {
                console.log('No results found');
                return;
            }

            this.databaseService.storeDiscoveredJobs(transformedResults);


            console.log(`------------------------------------`);
            
            // Log a user friendly list of results using chalk
            transformedResults.forEach((result, index) => {
                console.log(` `)
                console.log(chalk.blue(result.title));
                console.log(chalk.green(result.link));
                console.log(` `);
                console.log(`------------------------------------`);
            })

            console.log(chalk.yellow(`Page ${page_number} processed`) + ` | Found ${transformedResults.length} results for ${query}`);
            console.log(`------------------------------------`);
            console.log(` `);
            
        } catch (err) {

            console.error(err);
        } finally {
            if (page_number === 10) {
                console.log('Max pages reached.');
                return;
            }
            
            if (starts_at > 91) {
                console.log('Consider refining your search with more specific keywords');
                return;
            }
            const morePages = await this.inquirerService.askForMorePages();
            if (morePages) {
                await this.handle(query, options);
            }
        }
    }
}