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


const container = new Container();

if (env.DB_TYPE === 'sqlite') {
    container.bind<IDatabaseService>('DatabaseService').to(SQLiteService).inSingletonScope();
}

// Services
container.bind(LeverService).toSelf();
container.bind(InquirerService).toSelf();
container.bind(FileSystemService).toSelf();
container.bind(TransformationService).toSelf();
container.bind(LogService).toSelf();
container.bind(FeedbackService).toSelf().inSingletonScope();
container.bind(BrowserService).toSelf().inSingletonScope();
container.bind(SearchService).toDynamicValue((context) => {
    return new SearchService(
        context.container.get('DatabaseService'),
        {
            apiKey: env.GOOGLE_CUSTOM_SEARCH_API_KEY,
            id: env.GOOGLE_CUSTOM_SEARCH_CX
        });
});
container.bind(AiService).toDynamicValue((context) => {
    return new AiService(
        {
            apiKey: env.GPT4_API_KEY
        });
}).inSingletonScope();

// Controllers
container.bind(SearchController).toSelf();
container.bind(ScrapeController).toSelf();
container.bind(PrepareController).toSelf();
container.bind(ReviewController).toSelf();
container.bind(ApplyController).toSelf();
container.bind(LiveController).toSelf();

export default container;