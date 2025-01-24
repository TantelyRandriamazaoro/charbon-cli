import { Container, interfaces } from "inversify";
import SearchService from "./services/core/search.service";
import LogService from "./services/core/log.service";

import * as env from "./env";
import AiService from "./services/core/ai.service";
import TransformationService from "./services/core/transformation.service";
import SearchController from "./controllers/search.controller";
import ScrapeController from "./controllers/scrape.controller";
import ListController from "./controllers/review.controller";
import PrepareController from "./controllers/prepare.controller";
import ApplyController from "./controllers/apply.controller";
import SQLiteService from "./services/databases/sqlite.service";
import IDatabaseService from "./models/IDatabaseService";
import BrowserService from "./services/core/browser.service";
import FileSystemService from "./services/core/filesystem.service";
import InquirerService from "./services/core/inquirer.service";
import LeverService from "./services/boards/lever.service";
import ReviewController from "./controllers/review.controller";
import LiveController from "./controllers/live.controller";
import FeedbackService from "./services/core/feedback.service";
import isInitialized from "./utils/isInitialized";
import ConfigService from "./services/core/config.service";
import chalk from "chalk";
import inquirer from "inquirer";
import createStructure from "./utils/createStructure";
import structure from "./configs/structure";


// Export the initialized container
let container: Container | null = null;

const initializeContainer = async () => {
    if (!isInitialized()) {
        throw new Error("Initialization preconditions not met.");
    }

    container = new Container();

    container.bind(FileSystemService).toSelf();
    container.bind(ConfigService).toSelf().inSingletonScope();

    const configService = container.get(ConfigService);
    await configService.init();

    if (configService.get('database').type === 'sqlite') {
        container.bind<IDatabaseService>('DatabaseService').to(SQLiteService).inSingletonScope();
    }

    container.bind(LeverService).toSelf();
    container.bind(InquirerService).toSelf();
    container.bind(TransformationService).toSelf();
    container.bind(LogService).toSelf();
    container.bind(FeedbackService).toSelf().inSingletonScope();
    container.bind(BrowserService).toSelf().inSingletonScope();
    container.bind(SearchService).toSelf().inSingletonScope();
    container.bind(AiService).toSelf().inSingletonScope();

    container.bind(SearchController).toSelf();
    container.bind(ScrapeController).toSelf();
    container.bind(PrepareController).toSelf();
    container.bind(ReviewController).toSelf();
    container.bind(ApplyController).toSelf();
    container.bind(LiveController).toSelf();

    console.log("Container initialized");
    return container;
};

const getContainer = () => {
    if (!container) {
        throw new Error("Container not initialized. Call initializeContainer() first.");
    }
    return container;
};


export const run = async (callback: (container: Container) => Promise<void>) => {
    if (!isInitialized()) {
        console.log(chalk.red("Please initialize the project first"));

        const { init } = await inquirer.prompt([
            {
                type: "confirm",
                name: "init",
                message: "Would you like to initialize the project now?",
            },
        ]);

        if (init) {
            createStructure('./', structure);
            console.log(chalk.green("Project initialized successfully"));
        } else {
            process.exit(0);
        }

    }

    await initializeContainer();
    await callback(getContainer());
}