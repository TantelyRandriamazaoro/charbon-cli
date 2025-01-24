import path from "path";
import fs from "fs";

const __dirname = path.dirname(new URL(import.meta.url).pathname);

const templateFolder = path.join(__dirname, '../templates');

// Get .env.template file
const envTemplate = fs.readFileSync(path.join(templateFolder, '.env.template'), 'utf8');
const configTemplate = fs.readFileSync(path.join(templateFolder, '.config.template'), 'utf8');

// Generate folder structure for the project
export default {
    ".env": envTemplate,
    "resumes": {},
    "data": {
        "db.sqlite": "",
    },
    "knowledge.txt": '',
    "README.md": '',
    "charbon.config.js": configTemplate,
};