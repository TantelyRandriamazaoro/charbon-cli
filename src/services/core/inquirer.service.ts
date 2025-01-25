import Job from "@/models/Job";
import Status from "@/models/Status";
import inquirer from "inquirer";
import { inject, injectable } from "inversify";
import FileSystemService from "./filesystem.service";
import { LocationType } from "@/models/Search";
import countries from "@/data/countries";

export enum Actions {
    PROCEED = "PROCEED",
    SKIP = "SKIP",
    DUPLICATE = "DUPLICATE",
    SWAP = "SWAP",
    UPDATE = "UPDATE"
}

@injectable()
export default class InquirerService {

    constructor(
        @inject(FileSystemService) private filesystemService: FileSystemService
    ) { }

    async askForBrowserId() {
        const answers = await inquirer.prompt([
            {
                type: 'input',
                name: 'browserId',
                message: 'Enter the browser ID:',
            },
        ]);

        return answers.browserId as string;
    }

    async askForJobBoard() {
        const answers = await inquirer.prompt([
            {
                type: 'list',
                name: 'jobBoard',
                message: 'Select a job board to search:',
                choices: ['Lever', 'Greenhouse', 'Workable', 'Join']
            },
        ]);

        return answers.jobBoard.toLowerCase() as string;
    }

    async askForResume(files: string[]) {
        // Prompt the user to select a file
        const answers = await inquirer.prompt([
            {
                type: 'list',
                name: 'fileChoice',
                message: 'Pick a resume to use for this search:',
                choices: files,
            },
        ]);

        return answers.fileChoice as string;
    }

    // Ask for processing further pages
    async askForMorePages() {
        const answers = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'morePages',
                message: 'Do you want to process more pages?',
                default: true,
            },
        ]);

        return answers.morePages as boolean;
    }

    async askForReview() {
        const { action } = await inquirer.prompt([
            {
                type: "list",
                name: "action",
                message: "Are you interested in applying for this job?",
                choices: [
                    { name: "✅ Yes", value: Actions.PROCEED },
                    { name: "🔄 Yes, but swap resume", value: Actions.SWAP },
                    { name: "No, skip this job", value: Actions.SKIP },
                    { name: "No, I have already applied", value: Actions.DUPLICATE },
                ],
                default: Actions.PROCEED,
            },
        ]);

        return action as Actions;
    }

    async askForNextJob() {
        const answers = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'nextJob',
                message: 'Do you want to process the next job?',
                default: true,
            },
        ]);

        return answers.nextJob as boolean;
    }

    async askForCountry() {
        const answers = await inquirer.prompt([
            {
                type: 'search',
                name: 'country',
                message: 'Where do you want to search?',
                default: { code: 'global', name: 'Global' },
                source: async (input, { signal }) => {
                    if (!input) {
                        return [];
                    }
                    const filtered = countries.map((country) => ({
                        value: country,
                        name: country.name
                    })).filter((country) => country.name.toLowerCase().includes(input.toLowerCase()));

                    return [...filtered, { value: 'global', name: 'Global' }];
                }
            },
        ]);

        return answers.country as { code: string, name: string };
    }

    async askForLocationType() {
        const answers = await inquirer.prompt([
            {
                type: 'list',
                name: 'locationType',
                message: 'Select the location type:',
                choices: ['On-site', 'Hybrid', 'Remote'],
            },
        ]);

        return answers.locationType.toLowerCase() as LocationType;
    }

    async askForFinalReview() {

        const nextAction = await inquirer.prompt([
            {
                type: "list",
                name: "action",
                message:
                    "Are you satisfied with the answers?",
                choices: [
                    { name: "✅ Yes, Proceed to submit", value: Actions.PROCEED },
                    { name: "🔄 No, I want to modify some fields", value: Actions.UPDATE },
                    { name: "❌ No, I've changed my mind", value: Actions.SKIP },
                ],
            },
        ]);

        return nextAction.action as Actions;
    }

    async askForModification(job: Job) {
        const { modify } = await inquirer.prompt([
            {
                type: "list",
                name: "modify",
                message: "Which field do you want to modify?",
                choices: job.custom_fields!.map((field) => ({ name: field.label, value: field.label })),
            }
        ]);

        const { instructions } = await inquirer.prompt([
            {
                type: "input",
                name: "instructions",
                message: "Please write any instructions for the AI to regenerate the answer.",
                default: "Make it better, please.",
            },
        ]);

        return { modify, instructions };
    }
}
