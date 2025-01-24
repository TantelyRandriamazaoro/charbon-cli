import fs from 'fs';
import path from 'path';
import inquirer from 'inquirer';
import { injectable } from 'inversify';
import { Config } from '@/models/Config';

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


    async getConfigs(): Promise<Config> {
        const configPath = path.join(process.cwd(), 'charbon.config.js')

        // Check if the file exists
        if (!fs.existsSync(configPath)) {
            console.log(`The file '${configPath}' does not exist.`);
            throw new Error(`The config file '${configPath}' does not exist.`);
        }

        // The file is a module, so we can import it
        const config = await import(configPath);

        return config.default as Config;
    }

    async getKnowledgeBase() {
        const knowledgeBase = path.join(process.cwd(), 'knowledge.txt');

        // Check if the file exists
        if (!fs.existsSync(knowledgeBase)) {
            console.log(`The file '${knowledgeBase}' does not exist.`);
            return;
        }

        // Read the file
        const data = fs.readFileSync(knowledgeBase, 'utf8');
        return data as string;
    }

    async getCountries() {
        const countries = 'src/data/countries.json';

        // Check if the file exists
        if (!fs.existsSync(countries)) {
            console.log(`The file '${countries}' does not exist.`);
            return;
        }

        // Read the file
        const data = fs.readFileSync(countries, 'utf8');
        return JSON.parse(data) as { name: string; code: string; }[];
    }
}