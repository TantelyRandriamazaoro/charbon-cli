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
    private starts_at = 1;
    private page_number = 1;
    private duplicates = 0;
    private total = 0;

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

    async handle(query: string, options: SearchOptions, isRecursive = false) {
        try {
            if (!options.board) {
                const selectedBoard = await this.inquirerService.askForJobBoard();
                options.board = selectedBoard as Boards;
            }

            if (!options.country) {
                const selectedCountry = await this.inquirerService.askForCountry();
                options.country = selectedCountry.code;
                options.country_name = selectedCountry.name;
            }

            if (!options.location_type) {
                const selectedLocationType = await this.inquirerService.askForLocationType();
                options.location_type = selectedLocationType;
            }

            if (isRecursive) {
                this.starts_at += 10;
                this.page_number = Math.floor(this.starts_at / 10) + 1;
            } else {
                const lastQuery = await this.databaseService.getLastSearch(query.toLocaleLowerCase(), options);

                if (lastQuery) {
                    this.starts_at = lastQuery.starts_at + 10;
                    this.page_number = Math.floor(this.starts_at / 10) + 1;
                }
            }

            if (this.starts_at > 91 || this.page_number == 11) {
                throw new Error('Max pages reached');
            }

            if (!options.resume) {
                const resumes = await this.filesystemService.listResume();
                if (!resumes) {
                    throw new Error('No resumes found');
                }
                const selectedResume = await this.inquirerService.askForResume(resumes);
                options.resume = selectedResume;
            }

            const searchResults = await this.searchService.query(query, { ...options, starts_at: this.starts_at });

            if (searchResults.items.length === 0) {
                throw new Error('No results found');
            }

            const transformedResults = await this.transformationService.transformSearchResults({ ...searchResults, resume: options.resume });
            const { success, duplicates } = await this.databaseService.storeJobs(transformedResults);

            // Log a user friendly list of results using chalk
            success.forEach((result, index) => {
                console.log(
                    boxen(
                        chalk.blue(result.title) + '\n' + chalk.green(result.link),
                        {
                            padding: 0.5,
                            margin: 0.5,

                            borderStyle: 'round',
                            borderColor: 'cyan',
                        })
                );
            })

            this.duplicates += duplicates;
            this.total += success.length;

            await this.handle(query, options, true);
        } catch (err: any) {
            if (err?.message === 'Max pages reached') {
                return;
            } else if (err?.message === 'No resumes found') {
                console.log(chalk.red(`No resumes found`));
            } else if (err?.message === 'No results found' && this.total === 0) {
                console.log(chalk.red(`No results found for query ${query}`));
            } else if (err?.message === 'No results found' && this.total > 0) {
                return;
            } else {
                console.log(chalk.red(err.message));
            }
        } finally {
            if (!isRecursive) {
                console.log(chalk.green(`Total jobs found: ${this.total}`) + (this.duplicates > 0 ? ' | ' + chalk.yellow(`Duplicates: ${this.duplicates}`) : ''));
            }
        }
    }
}