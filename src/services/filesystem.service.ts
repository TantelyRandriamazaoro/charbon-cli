import fs from 'fs';
import path from 'path';
import inquirer from 'inquirer';
import { injectable } from 'inversify';

@injectable()
export default class FileSystemService {

    constructor() {
    }

    async listResume() {
        const dataFolder = 'resumes';

        // Check if the folder exists
        if (!fs.existsSync(dataFolder)) {
            console.log(`The folder '${dataFolder}' does not exist.`);
            return;
        }

        // Get the list of files in the "data" folder
        const files = fs.readdirSync(dataFolder).filter(file =>
            fs.statSync(path.join(dataFolder, file)).isFile()
        );

        if (files.length === 0) {
            console.log(`No files found in the '${dataFolder}' folder.`);
            return;
        }

        return files;
    }
}