import path from "path";
import fs from "fs";
import createTree from "./createTree";


const createStructure = (basePath: string, structure: any) => {
    for (const key in structure) {
        const fullPath = path.join(basePath, key);
        if (typeof structure[key] === 'object') {
            fs.mkdirSync(fullPath, { recursive: true });
            createStructure(fullPath, structure[key]);
        } else {
            fs.writeFileSync(fullPath, structure[key]);
        }
    }

    createTree(structure);
};

export default createStructure;