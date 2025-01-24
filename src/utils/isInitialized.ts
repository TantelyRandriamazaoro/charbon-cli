import fs from 'fs';
import path from 'path';

export default function isInitialized() {
    const configPath = path.resolve(process.cwd(), 'charbon.config.js');

    if (!fs.existsSync(configPath)) {
        return false;
    }

    return true;
}