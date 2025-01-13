import inquirer from "inquirer";
import { injectable } from "inversify";

@injectable()
export default class InquirerService {

    constructor() {}

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

    async askForReadiness() {
        const answers = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'ready',
                message: 'Is this application ready to submit?',
                default: true,
            },
        ]);

        return answers.ready as boolean;
    }
}
