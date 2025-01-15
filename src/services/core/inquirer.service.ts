import Job from "@/models/Job";
import Status from "@/models/Status";
import inquirer from "inquirer";
import { inject, injectable } from "inversify";
import FileSystemService from "./filesystem.service";

@injectable()
export default class InquirerService {

    constructor(
        @inject(FileSystemService) private filesystemService: FileSystemService
    ) { }

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

    async askForStatus(job: Job): Promise<Status> {
        const readinessAnswers = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'ready',
                message: 'Is this application ready to submit?',
                default: true,
            },
        ]);

        if (readinessAnswers.ready) {
            console.log('Great! The application is ready to submit.');
            return 'Ready';
        } else {
            const followUpAnswers = await inquirer.prompt([
                {
                    type: 'list',
                    name: 'reason',
                    message: 'Why is the application not ready?',
                    choices: [
                        'Modify some fields',
                        'Not qualified',
                        'Not interested',
                    ],
                },
            ]);

            if (followUpAnswers.reason === 'Modify some fields') {
                console.log('The application needs some modifications.');
                return 'Not Ready';
                // Update your data object or database with the new value here
            } else if (followUpAnswers.reason === 'Not qualified') {
                console.log('The application is not qualified.');
                return 'Not Qualified';
            } else if (followUpAnswers.reason === 'Not interested') {
                console.log('The applicant is not interested.');
                return 'Not Interested';
            }

            return 'Not Ready';
        }
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
        const countries = await this.filesystemService.getCountries();
        
        const answers = await inquirer.prompt([
            {
                type: 'search',
                name: 'country',
                message: 'Enter the country code to search for:',
                source: async (input, { signal }) => {
                    if (!input) {
                        return [];
                    }
                    return countries!.map((country) => ({
                        value: country.code,
                        name: country.name
                    })).filter((country) => country.name.toLowerCase().includes(input.toLowerCase()));
                }
            },
        ]);

        return answers.country as string;
    }
}