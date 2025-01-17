import Boards from "@/models/boards";
import { inject, injectable } from "inversify";
import SearchService from "@/services/core/search.service";
import TransformationService from "@/services/core/transformation.service";
import IDatabaseService from "@/models/IDatabaseService";
import FileSystemService from "@/services/core/filesystem.service";
import InquirerService from "@/services/core/inquirer.service";
import chalk from "chalk";
import { SearchOptions } from "@/models/Search";
import boxen from "boxen";

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

            if (!options.country) {
                const selectedCountry = await this.inquirerService.askForCountry();
                options.country = selectedCountry;
            }

            const lastQuery = await this.databaseService.getLastSearch(query.toLocaleLowerCase(), options);

            if (lastQuery) {
                starts_at = lastQuery.starts_at + 10;
                page_number = Math.floor(starts_at / 10) + 1;

                if (starts_at > 91 || page_number == 10) {
                    throw new Error('Max pages reached');
                }
            }

            if (!options.resume) {
                const resumes = await this.filesystemService.listResume();
                if (!resumes) {
                    throw new Error('No resumes found');
                }
                const selectedResume = await this.inquirerService.askForResume(resumes);
                options.resume = selectedResume;
            }

            const searchResults = await this.searchService.query(query, { ...options, starts_at });

            if (searchResults.items.length === 0) {
                throw new Error('No results found');
            }

            const transformedResults = await this.transformationService.transformSearchResults({ ...searchResults, resume: options.resume });
            const { success, duplicates } = await this.databaseService.storeDiscoveredJobs(transformedResults);

            // Log a user friendly list of results using chalk
            success.forEach((result, index) => {
                console.log(
                    boxen(
                        chalk.blue(result.title) + '\n' + chalk.green(result.link),
                        {
                            padding: 0.5,
                            margin: 0.5,

                            borderStyle: 'round',
                            borderColor: 'cyan'
                        })
                );
            })

            console.log(chalk.yellow(`Page ${page_number} processed`) + ` | Found ${success.length} results for ${query}` + (duplicates > 0 ? ` | ${duplicates} duplicate(s)` : ''));
            console.log(`------------------------------------`);
            console.log(` `);

            const morePages = await this.inquirerService.askForMorePages();
            if (morePages) {
                await this.handle(query, options);
            }
        } catch (err: any) {
            if (err?.message === 'Max pages reached') {
                console.log(chalk.yellow(`Max pages reached for query ${query}`));
            } else if (err?.message === 'No resumes found') {
                console.log(chalk.red(`No resumes found`));
            } else if (err?.message === 'No results found') {
                console.log(chalk.red(`No results found for query ${query}`));
            } else {
                console.log(chalk.red(err.message));
            }
        }
    }
}