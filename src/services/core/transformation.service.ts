import { SearchResults } from "@/models/Search"
import Boards from "@/models/boards";
import Job, { LeverCustomField, LeverCustomFieldCard, NormalizedCustomField, RawCustomField, ScrapedJobDetails } from "@/models/Job";
import { inject, injectable } from "inversify";
import AiService from "./ai.service";
import LeverService from "../boards/lever.service";

@injectable()
export default class TransformationService {
    constructor(
        @inject(AiService) private aiService: AiService,
        @inject(LeverService) private leverService: LeverService
    ) { }

    isValidBoardUrl(board: Boards, url?: string | null) {
        if (!url) {
            return false;
        }

        switch (board) {
            case 'lever':
                return this.leverService.isMatch(url);
            // case 'greenhouse':
            //     // Greenhouse job posting URLs are in the format: https://boards.greenhouse.io/{company}/jobs/{job_id}
            //     const regex2 = /^https:\/\/boards\.greenhouse\.io\/[a-zA-Z0-9\-]+\/jobs\/[0-9]+$/;
            //     return regex2.test(url);
            // case 'workable':
            //     // Workable job posting URLs are in the format: https://apply.workable.com/{company}/j/{job_id}
            //     const regex3 = /^https:\/\/apply\.workable\.com\/[a-zA-Z0-9\-]+\/j\/[a-f0-9\-]{36}$/;
            //     return regex3.test(url);
            default:
                return false;
        }
    }

    cleanBoardUrl(board: Boards, url?: string | null) {
        if (!url) {
            throw new Error('URL is required');
        }

        switch (board) {
            case 'lever':
                const [base] = url.split('?');
                return base.replace(/\/apply$/, '');
            // case 'greenhouse':
            //     return url.replace(/\/jobs\/[0-9]+$/, '');
            // case 'workable':
            //     return url.replace(/\/j\/[a-f0-9\-]{36}$/, '');
            default:
                return url;
        }
    }

    async transformSearchResults(data: SearchResults): Promise<Job[]> {
        const seenLinks = new Set<string>(); // Track unique links

        return data.items
            .filter((item) => {
                return item.link && this.isValidBoardUrl(data.board, item.link);
            })
            .filter((item) => {
                const cleanLink = this.cleanBoardUrl(data.board, item.link);
                if (seenLinks.has(cleanLink)) {
                    return false; // Duplicate found, exclude it
                }
                seenLinks.add(cleanLink); // Mark as seen
                return true; // Include this item
            })
            .map((item) => {
                return {
                    search_id: data.id,
                    board: data.board,
                    resume: data.resume,
                    title: item.title || '',
                    link: this.cleanBoardUrl(data.board, item.link),
                };
            });
    }

    mapFieldType(type: LeverCustomField['type'], board: Boards): NormalizedCustomField['type'] {
        switch (board) {
            case 'lever':
                switch (type) {
                    case 'multiple-choice':
                        return 'radio';
                    case 'multiple-select':
                        return 'checkbox';
                    case 'textarea':
                        return 'textarea';
                    case 'dropdown':
                        return 'select';
                    case 'text':
                        return 'text';
                    default:
                        return 'text';
                }
            default:
                return 'text';
        }

    }


    normalizeCustomFields(data: RawCustomField[], board: Boards): NormalizedCustomField[] {
        switch (board) {
            case 'lever':
                return data.reduce((acc, card) => {
                    return acc.concat(card.fields.map((field, index) => {
                        const transformedField: NormalizedCustomField = {
                            type: this.mapFieldType(field.type, board),
                            label: field.text,
                            name: card.name.replace('baseTemplate', 'field' + index.toString()),
                            possible_values: field.options ? field.options.map((option) => option.text) : [],
                        };

                        if (transformedField.possible_values?.length === 0) {
                            delete transformedField.possible_values;
                        }

                        return transformedField;
                    }));
                }, [] as NormalizedCustomField[]);
            default:
                return [];

        }
    }

    transformScrapedJobs(data: ScrapedJobDetails<RawCustomField>[]): ScrapedJobDetails<NormalizedCustomField>[] {
        return data.map((job) => {
            return {
                ...job,
                custom_fields: this.normalizeCustomFields(job.custom_fields, job.board),
            };
        });
    }

    
}